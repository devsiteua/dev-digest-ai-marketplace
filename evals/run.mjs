#!/usr/bin/env node
/**
 * Behavior evals for the plugins in this marketplace.
 *
 * Why this exists rather than `claude plugin eval`: that command is the right
 * long-term home and this repository should migrate to it, but it is gated
 * behind early access and refuses to run for this account —
 * "`plugin eval` is currently in early access". Its case schema is not
 * documented outside the tool, and guessing it would produce files nobody can
 * run. See evals/README.md § Migration.
 *
 * What a case proves: that a plugin *behaves* a certain way, not that its files
 * parse. `claude plugin validate` already covers shape. These cover the
 * promises the plugin READMEs make — report and stop, never guess a command,
 * an unrecognised path gets no practice.
 *
 * Each case runs the real CLI against a throwaway copy of a fixture repository,
 * so a case that writes cannot damage anything and a read-only claim can be
 * checked by comparing the tree afterwards.
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS = path.join(ROOT, 'plugins');
const FIXTURES = path.join(ROOT, 'evals', 'fixtures');

/* ------------------------------------------------------------------ cases */

/**
 * A case is Markdown with a small, strict frontmatter grammar — deliberately
 * tiny so it is parsed here in a few lines instead of pulling in a YAML
 * dependency for six files:
 *
 *   key: scalar
 *   key:
 *     - list item
 *     - key: value          (a one-key mapping, used by graders)
 *
 * Everything after the closing `---` is the prompt.
 */
function parseCase(text, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${file}: no frontmatter`);

  const [, head, prompt] = match;
  const data = {};
  let listKey = null;

  for (const raw of head.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;

    const item = /^\s*-\s+(.*)$/.exec(raw);
    if (item && listKey) {
      const pair = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(item[1]);
      data[listKey].push(pair ? { [pair[1]]: unquote(pair[2]) } : unquote(item[1]));
      continue;
    }

    const field = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(raw);
    if (!field) continue;

    if (field[2] === '') {
      listKey = field[1];
      data[listKey] = [];
    } else {
      listKey = null;
      data[field[1]] = unquote(field[2]);
    }
  }

  return { ...data, prompt: prompt.trim(), file };
}

/**
 * A double-quoted scalar carries escapes, the way YAML's does: `\\` is one
 * backslash, `\"` is a quote. Without that, a grader written `"pricing\\.js"`
 * reaches `new RegExp` as a literal backslash followed by a dot and matches
 * nothing — and, worse, a pattern like `[^\\n]` can still match by luck, so the
 * case passes for the wrong reason. Single-quoted scalars are literal, as in
 * YAML.
 */
const unquote = (value) => {
  const trimmed = value.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, (_, char) =>
      char === 'n' ? '\n' : char === 't' ? '\t' : char
    );
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 1) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
};

async function loadCases(filter) {
  const cases = [];

  for (const plugin of (await readdir(PLUGINS, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()) {
    const dir = path.join(PLUGINS, plugin, 'evals');
    if (!existsSync(dir)) continue;

    for (const name of (await readdir(dir)).filter((f) => f.endsWith('.case.md')).sort()) {
      const file = path.join(dir, name);
      const parsed = parseCase(await readFile(file, 'utf8'), file);
      parsed.plugin = plugin;
      parsed.name = parsed.name ?? name.replace(/\.case\.md$/, '');
      if (!filter || parsed.name.includes(filter)) cases.push(parsed);
    }
  }

  return cases;
}

/* --------------------------------------------------------------- fixtures */

/** A stable fingerprint of a directory tree: relative path -> sha256. */
async function fingerprint(dir) {
  const entries = {};

  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        entries[path.relative(dir, full)] = createHash('sha256')
          .update(await readFile(full))
          .digest('hex');
      }
    }
  };

  await walk(dir);
  return entries;
}

function treeDiff(before, after) {
  const changed = [];
  for (const file of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[file] !== after[file]) {
      changed.push(!(file in before) ? `+ ${file}` : !(file in after) ? `- ${file}` : `M ${file}`);
    }
  }
  return changed.sort();
}

/* ---------------------------------------------------------------- graders */

/**
 * Deterministic graders only. An LLM judge would make the suite's own verdict
 * as variable as the thing it is judging, and every promise checked here is
 * literal enough to match on.
 */
function grade(spec, output, changed) {
  const results = [];
  const add = (ok, label, detail) => results.push({ ok, label, detail });

  for (const grader of spec.expect ?? []) {
    if (typeof grader === 'string') {
      add(new RegExp(grader, 'i').test(output), `matches /${grader}/i`);
      continue;
    }
    const [[kind, value]] = Object.entries(grader);

    if (kind === 'contains') add(output.toLowerCase().includes(String(value).toLowerCase()), `contains "${value}"`);
    else if (kind === 'absent') add(!output.toLowerCase().includes(String(value).toLowerCase()), `absent "${value}"`);
    else if (kind === 'matches') add(new RegExp(value, 'i').test(output), `matches /${value}/i`);
    else if (kind === 'not_matches') add(!new RegExp(value, 'i').test(output), `not /${value}/i`);
    else add(false, `unknown grader "${kind}"`);
  }

  if (spec.files_unchanged === true) {
    add(changed.length === 0, 'fixture unchanged', changed.join(', '));
  }

  return results;
}

/* -------------------------------------------------------------- execution */

function pluginDirs(spec) {
  const names = spec.plugins ?? [spec.plugin];
  return names.flatMap((name) => ['--plugin-dir', path.join(PLUGINS, String(name))]);
}

async function runCase(spec, { ablation }) {
  const workspace = await mkdtemp(path.join(tmpdir(), 'ddm-eval-'));
  const arm = async (withPlugins) => {
    const dir = path.join(workspace, withPlugins ? 'with' : 'without');
    await mkdir(dir, { recursive: true });
    if (spec.fixture) await cp(path.join(FIXTURES, String(spec.fixture)), dir, { recursive: true });

    const before = await fingerprint(dir);
    const args = [
      '-p', spec.prompt,
      '--output-format', 'json',
      '--permission-mode', 'bypassPermissions',
      ...(withPlugins ? pluginDirs(spec) : []),
    ];

    let payload;
    try {
      const { stdout } = await run('claude', args, {
        cwd: dir,
        maxBuffer: 64 * 1024 * 1024,
        timeout: Number(spec.timeout_seconds ?? 600) * 1000,
      });
      payload = JSON.parse(stdout);
    } catch (error) {
      return { failed: true, error: error.message.slice(0, 400), output: '', cost: 0, changed: [] };
    }

    return {
      failed: false,
      output: String(payload.result ?? ''),
      cost: Number(payload.total_cost_usd ?? 0),
      turns: Number(payload.num_turns ?? 0),
      changed: treeDiff(before, await fingerprint(dir)),
    };
  };

  try {
    const withPlugin = await arm(true);
    const graded = withPlugin.failed
      ? [{ ok: false, label: 'run failed', detail: withPlugin.error }]
      : grade(spec, withPlugin.output, withPlugin.changed);

    let baseline = null;
    if (ablation) {
      const without = await arm(false);
      const baselineGraded = without.failed ? [] : grade(spec, without.output, without.changed);
      baseline = {
        cost: without.cost,
        passed: baselineGraded.filter((r) => r.ok).length,
        total: baselineGraded.length,
      };
    }

    return { spec, withPlugin, graded, baseline };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

/* ------------------------------------------------------------------- main */

async function main() {
  const argv = process.argv.slice(2);
  const flag = (name) => argv.includes(`--${name}`);
  const value = (name) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  const ablation = flag('ablation');
  const cases = await loadCases(value('case'));

  if (cases.length === 0) {
    console.error('No eval cases found under plugins/*/evals/*.case.md');
    process.exit(1);
  }

  // Parsing and fixtures are checkable without spending anything. Every run of
  // the real suite costs money, so there is a way to find a typo that does not.
  if (flag('dry-run')) {
    let problems = 0;
    for (const spec of cases) {
      const fixture = spec.fixture ? path.join(FIXTURES, String(spec.fixture)) : null;
      const missing = fixture && !existsSync(fixture);
      const graders = (spec.expect ?? []).length + (spec.files_unchanged === true ? 1 : 0);

      for (const grader of spec.expect ?? []) {
        const [[kind, pattern]] = typeof grader === 'string' ? [['matches', grader]] : Object.entries(grader);
        if (kind !== 'matches' && kind !== 'not_matches') continue;
        try {
          new RegExp(pattern);
        } catch (error) {
          console.log(`  ✗ ${spec.plugin}/${spec.name}: bad regex ${pattern} — ${error.message}`);
          problems += 1;
        }
        // A surviving double backslash means the escape was not unquoted and the
        // pattern will match nothing. It cost a real run to find this once.
        if (/\\\\/.test(pattern)) {
          console.log(`  ✗ ${spec.plugin}/${spec.name}: literal \\\\ in ${pattern} — escapes were not applied`);
          problems += 1;
        }
      }

      if (missing) {
        console.log(`  ✗ ${spec.plugin}/${spec.name}: fixture "${spec.fixture}" does not exist`);
        problems += 1;
      }
      if (graders === 0) {
        console.log(`  ✗ ${spec.plugin}/${spec.name}: no graders — a case that cannot fail is not a case`);
        problems += 1;
      }
      if (!spec.prompt) {
        console.log(`  ✗ ${spec.plugin}/${spec.name}: empty prompt`);
        problems += 1;
      }

      console.log(
        `  ${problems === 0 ? '·' : ' '} ${spec.plugin}/${spec.name}` +
          `${spec.negative === true ? ' [negative]' : ''} — ${graders} grader(s), ` +
          `fixture ${spec.fixture ?? 'none'}, plugins ${(spec.plugins ?? [spec.plugin]).join('+')}`
      );
    }
    console.log(`\n${cases.length} case(s), ${problems} problem(s). Nothing was run.`);
    process.exit(problems === 0 ? 0 : 1);
  }

  console.log(`Running ${cases.length} case(s)${ablation ? ' with a no-plugin baseline arm' : ''}\n`);

  const results = [];
  let cost = 0;

  for (const spec of cases) {
    process.stdout.write(`  ${spec.plugin}/${spec.name} … `);
    const result = await runCase(spec, { ablation });
    results.push(result);
    cost += result.withPlugin.cost + (result.baseline?.cost ?? 0);

    const failed = result.graded.filter((check) => !check.ok);
    if (failed.length === 0) {
      const delta = result.baseline
        ? ` (baseline ${result.baseline.passed}/${result.baseline.total})`
        : '';
      console.log(`pass  $${result.withPlugin.cost.toFixed(3)}${delta}`);
    } else {
      console.log(`FAIL  $${result.withPlugin.cost.toFixed(3)}`);
      for (const check of failed) {
        console.log(`      ✗ ${check.label}${check.detail ? ` — ${check.detail}` : ''}`);
      }
    }
  }

  const failedCases = results.filter((r) => r.graded.some((c) => !c.ok));

  console.log(
    `\n${results.length - failedCases.length}/${results.length} cases passed · $${cost.toFixed(2)} total`
  );

  if (ablation) {
    console.log(
      '\nA baseline that scores as well as the plugin arm means the case is not measuring the plugin.'
    );
  }

  const out = value('json');
  if (out) {
    await writeFile(
      out,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          totalCostUsd: Number(cost.toFixed(4)),
          cases: results.map((r) => ({
            plugin: r.spec.plugin,
            name: r.spec.name,
            negative: r.spec.negative === true,
            passed: r.graded.every((c) => c.ok),
            costUsd: Number(r.withPlugin.cost.toFixed(4)),
            turns: r.withPlugin.turns,
            checks: r.graded,
            filesChanged: r.withPlugin.changed,
            // Only on failure: enough to judge whether the plugin misbehaved or
            // the grader did, without storing a passing run's full transcript.
            output: r.graded.every((c) => c.ok) ? undefined : r.withPlugin.output,
            baseline: r.baseline,
          })),
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    console.log(`\nWrote ${out}`);
  }

  process.exit(failedCases.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
