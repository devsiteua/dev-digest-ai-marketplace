#!/usr/bin/env node
/**
 * Builds the static catalog index consumed by site/.
 *
 * Reads .claude-plugin/marketplace.json, every plugin manifest and README, and
 * writes site/public/{index,releases,stats}.json plus site/public/bodies/.
 * The output is never committed — see docs/SITE-SPEC.md.
 *
 * Scope note: this reads manifests, READMEs, COMPATIBILITY.md, CHANGELOG.md and
 * the frontmatter of every agent, skill and command.
 */

import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveGraph } from './graph.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE = path.join(ROOT, '.claude-plugin', 'marketplace.json');
const OUT = path.join(ROOT, 'site', 'public');
const BODIES = path.join(OUT, 'bodies');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

const readOptional = async (file) =>
  existsSync(file) ? await readFile(file, 'utf8') : null;

/** A manifest author may be a string or { name }. Normalise to a string. */
const authorName = (author) =>
  typeof author === 'string' ? author : author?.name ?? null;

/**
 * Minimal YAML frontmatter reader: enough for `key: value` and `key: [a, b]`,
 * which is all an agent or skill file uses. A quoted value keeps its inner
 * punctuation; anything more elaborate is not worth a YAML dependency here.
 */
function frontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!field) continue;

    let value = field[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    fields[field[1]] = value;
  }
  return fields;
}

/** `Read, Grep, Glob` or `[Read, Grep]` -> ['Read', 'Grep', 'Glob']. */
const toolList = (value) =>
  !value
    ? []
    : value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((tool) => tool.trim())
        .filter(Boolean);

const listDirs = async (dir) =>
  existsSync(dir)
    ? (await readdir(dir, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];

const listFiles = async (dir, ext) =>
  existsSync(dir)
    ? (await readdir(dir, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith(ext))
        .map((e) => e.name)
        .sort()
    : [];

/**
 * Every agent, skill and command a plugin ships, from its own frontmatter.
 * The file's own `name:` wins over its filename — a mismatch is how a component
 * ends up unreachable under the name the docs give it, so it is an error.
 */
async function collectArtifacts(dir, pluginName) {
  const artifacts = [];

  const add = (kind, file, source, fallbackName) => {
    const fields = frontmatter(source);
    if (!fields?.name) {
      throw new Error(
        `${pluginName}: ${path.relative(ROOT, file)} has no \`name\` in its frontmatter`
      );
    }
    if (fallbackName && fields.name !== fallbackName) {
      throw new Error(
        `${pluginName}: ${path.relative(ROOT, file)} declares name "${fields.name}" ` +
          `but sits at "${fallbackName}" — they must agree`
      );
    }

    artifacts.push({
      id: `${pluginName}:${fields.name}`,
      kind,
      name: fields.name,
      plugin: pluginName,
      description: fields.description ?? '',
      model: fields.model ?? null,
      tools: toolList(fields.tools ?? fields['allowed-tools']),
      keywords: [],
      bodyId: `${pluginName}--${kind}--${fields.name}`,
      source,
    });
  };

  for (const name of await listFiles(path.join(dir, 'agents'), '.md')) {
    const file = path.join(dir, 'agents', name);
    add('agent', file, await readFile(file, 'utf8'), path.basename(name, '.md'));
  }

  for (const name of await listDirs(path.join(dir, 'skills'))) {
    const file = path.join(dir, 'skills', name, 'SKILL.md');
    if (!existsSync(file)) {
      throw new Error(`${pluginName}: skills/${name}/ has no SKILL.md`);
    }
    add('skill', file, await readFile(file, 'utf8'), name);
  }

  for (const name of await listFiles(path.join(dir, 'commands'), '.md')) {
    const file = path.join(dir, 'commands', name);
    add('command', file, await readFile(file, 'utf8'), null);
  }

  return artifacts;
}

/**
 * The minimum Claude Code version, from the plugin's COMPATIBILITY.md. Absent
 * rather than guessed: a fabricated floor is worse than a missing one, because
 * an install that should have been refused is the failure it exists to prevent.
 */
function compatibilityOf(text) {
  if (!text) return null;
  const match = /\*\*Minimum:\s*([0-9]+\.[0-9]+\.[0-9]+)\.?\*\*/.exec(text);
  return match ? { claudeCode: `>=${match[1]}` } : null;
}

/**
 * Releases from a Keep a Changelog file, newest first.
 *
 * `Unreleased` is not a release and never appears in the feed — the whole point
 * of the feed is what a consumer can actually install. A version heading with no
 * date keeps `date: null` rather than being given today's: a fabricated release
 * date is worse than a missing one (docs/SITE-SPEC.md).
 */
function parseChangelog(text, plugin) {
  if (!text) return [];

  const releases = [];
  let current = null;
  let section = null;

  for (const line of text.split(/\r?\n/)) {
    const version = /^##\s+\[?([^\]\s]+)\]?\s*(?:[-–—]\s*(\d{4}-\d{2}-\d{2}))?\s*$/.exec(line);

    if (version) {
      const name = version[1];
      current = /^unreleased$/i.test(name)
        ? null
        : {
            plugin,
            version: name,
            date: version[2] ?? null,
            // The convention in docs/RELEASES.md. Built here rather than read
            // from the remote: the feed describes what a tag should be called,
            // and a missing tag is a release-checklist failure, not a UI one.
            tag: `${plugin}--v${name}`,
            sections: {},
          };
      if (current) releases.push(current);
      section = null;
      continue;
    }

    const heading = /^###\s+(.+?)\s*$/.exec(line);
    if (heading) {
      section = current ? heading[1] : null;
      if (current && section) current.sections[section] ??= [];
      continue;
    }

    const bullet = /^[-*]\s+(.+?)\s*$/.exec(line);
    if (bullet && current && section) {
      current.sections[section].push(bullet[1]);
    }
  }

  return releases;
}

/** Newest release date across every plugin, or null when nothing is dated. */
const newestReleaseDate = (releases) => {
  const dates = releases.map((r) => r.date).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
};

async function collectPlugin(entry) {
  const dir = path.resolve(ROOT, entry.source);
  const manifestPath = path.join(dir, '.claude-plugin', 'plugin.json');

  if (!existsSync(manifestPath)) {
    throw new Error(
      `${entry.name}: no manifest at ${path.relative(ROOT, manifestPath)}`
    );
  }

  const manifest = await readJson(manifestPath);

  if (manifest.name !== entry.name) {
    throw new Error(
      `${entry.name}: manifest name is "${manifest.name}" — ` +
        'the marketplace entry, the directory and the manifest must agree'
    );
  }

  const readme = await readOptional(path.join(dir, 'README.md'));
  const bodyId = manifest.name;

  if (readme) {
    await writeFile(path.join(BODIES, `${bodyId}.md`), readme, 'utf8');
  }

  const compatibility = compatibilityOf(
    await readOptional(path.join(dir, 'COMPATIBILITY.md'))
  );

  const releases = parseChangelog(
    await readOptional(path.join(dir, 'CHANGELOG.md')),
    manifest.name
  );

  const artifacts = await collectArtifacts(dir, manifest.name);

  for (const artifact of artifacts) {
    await writeFile(
      path.join(BODIES, `${artifact.bodyId}.md`),
      artifact.source,
      'utf8'
    );
    delete artifact.source;
  }

  return {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description ?? '',
    author: authorName(manifest.author),
    license: manifest.license ?? null,
    homepage: manifest.homepage ?? null,
    keywords: manifest.keywords ?? [],
    dependencies: manifest.dependencies ?? [],
    compatibility,
    artifacts,
    releases,
    bodyId: readme ? bodyId : null,
  };
}

async function main() {
  const marketplace = await readJson(MARKETPLACE);

  await rm(BODIES, { recursive: true, force: true });
  await mkdir(BODIES, { recursive: true });

  const plugins = [];
  for (const entry of marketplace.plugins ?? []) {
    plugins.push(await collectPlugin(entry));
  }

  const { graph, errors, notes } = resolveGraph(plugins);

  for (const note of notes) console.warn(`  note: ${note}`);

  if (errors.length) {
    throw new Error(
      `dependency graph:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  for (const plugin of plugins) Object.assign(plugin, graph.get(plugin.name));

  // The index carries artifacts once, at the top level; each plugin keeps only
  // the ids, so a plugin card does not ship every description twice.
  const artifacts = plugins.flatMap((plugin) => plugin.artifacts);
  for (const plugin of plugins) {
    plugin.artifacts = plugin.artifacts.map((artifact) => artifact.id);
  }
  const generatedAt = new Date().toISOString();

  const index = {
    generatedAt,
    marketplace: {
      name: marketplace.name,
      owner: authorName(marketplace.owner),
      description: marketplace.metadata?.description ?? '',
    },
    plugins,
    artifacts,
  };

  // Newest first across every plugin. An undated entry sorts last rather than
  // being guessed into an order.
  const allReleases = plugins
    .flatMap((plugin) => plugin.releases)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  for (const plugin of plugins) delete plugin.releases;

  const releases = { generatedAt, releases: allReleases };

  const stats = {
    generatedAt,
    plugins: plugins.length,
    artifacts: artifacts.length,
    artifactsByKind: artifacts.reduce((acc, a) => {
      acc[a.kind] = (acc[a.kind] ?? 0) + 1;
      return acc;
    }, {}),
    releases: allReleases.length,
    // Null rather than a guess: with nothing released, the UI says so instead of
    // showing a date nobody can install (docs/SITE-SPEC.md).
    latestRelease: newestReleaseDate(allReleases),
  };

  const write = (name, data) =>
    writeFile(path.join(OUT, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  await Promise.all([
    write('index.json', index),
    write('releases.json', releases),
    write('stats.json', stats),
  ]);

  console.log(
    `build-index: ${plugins.length} plugins, ${artifacts.length} artifacts, ` +
      `${allReleases.length} releases -> ${path.relative(ROOT, OUT)}`
  );
}

main().catch((error) => {
  console.error(`build-index failed: ${error.message}`);
  process.exit(1);
});
