#!/usr/bin/env node
/**
 * Cost per successful run of one fixed scenario, for two arms, with a median.
 *
 * The method is docs/COST-BASELINE.md: one scenario, the same model in both
 * arms, several runs each, and the **median** rather than the best run. Two
 * rules this script enforces so a number cannot flatter itself:
 *
 *   1. A run that did not do the work does not count. A cheaper arm that fails
 *      is not cheaper, so every run is checked against a success predicate and
 *      failures are reported separately rather than averaged in.
 *   2. Arms differ in exactly one thing. The model is pinned identically and
 *      only the plugin directories change — never the model and the routing in
 *      the same experiment.
 *
 * Usage:
 *   node scripts/measure-cost.mjs --config <config.json> [--runs 3] [--json out]
 */

import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const argv = process.argv.slice(2);
const flagValue = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};

const median = (numbers) => {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

async function oneRun({ prompt, fixture, pluginDirs, model, successGlobDir, successPattern }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'ddm-cost-'));
  try {
    await cp(fixture, dir, { recursive: true });

    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--permission-mode', 'bypassPermissions',
      ...(model ? ['--model', model] : []),
      ...pluginDirs.flatMap((d) => ['--plugin-dir', path.resolve(d)]),
    ];

    const started = Date.now();
    const { stdout } = await run('claude', args, {
      cwd: dir,
      maxBuffer: 64 * 1024 * 1024,
      timeout: 1_200_000,
    });
    const payload = JSON.parse(stdout);
    const elapsedMs = Date.now() - started;

    // Did the run actually do the work? A cheap failure is not a saving.
    let produced = [];
    const target = path.join(dir, successGlobDir ?? '.');
    if (existsSync(target)) {
      produced = (await readdir(target)).filter((f) =>
        successPattern ? new RegExp(successPattern).test(f) : true
      );
    }

    const usage = payload.usage ?? {};
    return {
      ok: produced.length > 0,
      produced,
      costUsd: Number(payload.total_cost_usd ?? 0),
      turns: Number(payload.num_turns ?? 0),
      elapsedMs,
      inputTokens: Number(usage.input_tokens ?? 0),
      outputTokens: Number(usage.output_tokens ?? 0),
      cacheReadTokens: Number(usage.cache_read_input_tokens ?? 0),
      cacheWriteTokens: Number(usage.cache_creation_input_tokens ?? 0),
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function summarise(runs) {
  const ok = runs.filter((r) => r.ok);
  const pick = (key) => median(ok.map((r) => r[key]));
  return {
    runs: runs.length,
    successful: ok.length,
    medianCostUsd: pick('costUsd'),
    medianTurns: pick('turns'),
    medianElapsedMs: pick('elapsedMs'),
    medianInputTokens: pick('inputTokens'),
    medianOutputTokens: pick('outputTokens'),
    medianCacheReadTokens: pick('cacheReadTokens'),
    medianCacheWriteTokens: pick('cacheWriteTokens'),
  };
}

async function main() {
  const config = JSON.parse(await readFile(flagValue('config'), 'utf8'));
  const runsPerArm = Number(flagValue('runs', config.runs ?? 3));

  console.log(`Scenario: ${config.name}`);
  console.log(`Model: ${config.model ?? 'default'} · ${runsPerArm} run(s) per arm\n`);

  const results = {};

  for (const [armName, arm] of Object.entries(config.arms)) {
    const runs = [];
    for (let i = 1; i <= runsPerArm; i += 1) {
      process.stdout.write(`  ${armName} run ${i}/${runsPerArm} … `);
      const result = await oneRun({
        prompt: config.prompt,
        fixture: path.resolve(config.fixture),
        pluginDirs: arm.pluginDirs,
        model: config.model,
        successGlobDir: config.successDir,
        successPattern: config.successPattern,
      });
      runs.push(result);
      console.log(
        `${result.ok ? 'ok' : 'DID NOT PRODUCE OUTPUT'}  $${result.costUsd.toFixed(3)}  ` +
          `${result.turns} turns  ${(result.elapsedMs / 1000).toFixed(0)}s`
      );
    }
    results[armName] = { summary: summarise(runs), runs };
  }

  const names = Object.keys(results);
  console.log('\n| metric | ' + names.join(' | ') + ' |');
  console.log('|---|' + names.map(() => '---|').join(''));
  const row = (label, key, format = (v) => (v === null ? 'n/a' : String(v))) =>
    console.log(
      `| ${label} | ` + names.map((n) => format(results[n].summary[key])).join(' | ') + ' |'
    );

  row('successful runs', 'successful', (v) => `${v}/${runsPerArm}`);
  row('median cost', 'medianCostUsd', (v) => (v === null ? 'n/a' : `$${v.toFixed(3)}`));
  row('median turns', 'medianTurns');
  row('median latency', 'medianElapsedMs', (v) => (v === null ? 'n/a' : `${(v / 1000).toFixed(0)}s`));
  row('median input tok', 'medianInputTokens');
  row('median output tok', 'medianOutputTokens');
  row('median cache read tok', 'medianCacheReadTokens');
  row('median cache write tok', 'medianCacheWriteTokens');

  if (names.length === 2) {
    const [a, b] = names.map((n) => results[n].summary.medianCostUsd);
    if (a && b) {
      const delta = ((b - a) / a) * 100;
      console.log(
        `\n${names[1]} vs ${names[0]}: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% median cost`
      );
    }
  }

  const out = flagValue('json');
  if (out) {
    await writeFile(
      out,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), config, results }, null, 2)}\n`,
      'utf8'
    );
    console.log(`\nWrote ${out}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
