#!/usr/bin/env node
/**
 * Builds the static catalog index consumed by site/.
 *
 * Reads .claude-plugin/marketplace.json, every plugin manifest and README, and
 * writes site/public/{index,releases,stats}.json plus site/public/bodies/.
 * The output is never committed — see docs/SITE-SPEC.md.
 *
 * Scope note: this reads manifests and READMEs. Component frontmatter
 * (agents/, skills/, commands/), changelog parsing for the release feed and
 * compatibility parsing are added once the plugins are populated.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  return {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description ?? '',
    author: authorName(manifest.author),
    license: manifest.license ?? null,
    homepage: manifest.homepage ?? null,
    keywords: manifest.keywords ?? [],
    dependencies: manifest.dependencies ?? [],
    // TODO(step 4): read from the plugin's COMPATIBILITY.md once it exists.
    compatibility: null,
    // TODO(step 4): enumerate agents/, skills/ and commands/ frontmatter.
    artifacts: [],
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

  const artifacts = plugins.flatMap((plugin) => plugin.artifacts);
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

  // TODO(step 6): build from each plugin's CHANGELOG.md.
  const releases = { generatedAt, releases: [] };

  const stats = {
    generatedAt,
    plugins: plugins.length,
    artifacts: artifacts.length,
    artifactsByKind: artifacts.reduce((acc, a) => {
      acc[a.kind] = (acc[a.kind] ?? 0) + 1;
      return acc;
    }, {}),
    // Absent rather than zero: no release has been parsed yet, and a fabricated
    // date is worse than a missing one (docs/SITE-SPEC.md).
    latestRelease: null,
  };

  const write = (name, data) =>
    writeFile(path.join(OUT, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  await Promise.all([
    write('index.json', index),
    write('releases.json', releases),
    write('stats.json', stats),
  ]);

  console.log(
    `build-index: ${plugins.length} plugins, ${artifacts.length} artifacts ` +
      `-> ${path.relative(ROOT, OUT)}`
  );
}

main().catch((error) => {
  console.error(`build-index failed: ${error.message}`);
  process.exit(1);
});
