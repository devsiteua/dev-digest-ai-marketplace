# Cost baseline

Cost per successful SDD workflow, measured before and after one optimization.

**Status: measured.** One optimization measured end to end; it did not reduce
cost, and that is recorded as the result rather than retried until it did. Static costs below are exact and reproducible for free;
the dynamic table is a median over real runs. Any cell still empty is a number
nobody has produced — an estimate presented as a measurement is worse than no
number.

## Method

- One fixed scenario: a user asks for a spec and a plan for one small feature.
- The same eval set with explicit acceptance criteria for every run.
- The same model for every run in a comparison. **Never change the model and the
  routing in the same experiment** — the result cannot be attributed.
- At least several runs per configuration. Report the **median**, not the best
  run.

## Where the numbers come from

`npm run eval -- --json <path>` records `costUsd` and `turns` per case, read
from the CLI's own `total_cost_usd`. That is the measuring instrument; step 8
does not need a second one.

The `sdd-engineering/no-test-command` case is already the shape this document
wants — the real `implementation-planner` agent, on a real spec, in a fixture
repository — so it is the natural starting point for the scenario below rather
than a new harness. What it still needs before it can serve as a baseline: a
fixed run count with a median rather than a single run, and a recorded model.

**Nothing here is filled in from an eval run yet.** A per-case cost from the
behaviour suite is not the same measurement as cost per successful workflow, and
copying one into the other would be exactly the misattribution the method
section warns about.

## Static cost — what loads before anything runs

`claude plugin details <name>` reports this. It costs nothing, it is
deterministic, and it does not vary run to run, so it is measured once and
quoted rather than sampled.

**Always-on** is added to every session merely by having the plugin installed:
component names and descriptions, nothing else. **On-invoke** is paid each time
that component actually fires.

| Plugin | Always-on |
|---|---|
| `sdd-engineering` | ~1,470 tok |
| `engineering-paved-path` | ~651 tok |
| `architecture-review` | ~202 tok |
| `research-tools` | ~168 tok |
| **All four installed** | **~2,491 tok per session** |

Per component, on the version measured:

| Component | Always-on | On-invoke |
|---|---|---|
| `sdd-engineering:implementation-planner` | ~240 | ~5.6k |
| `sdd-engineering:spec-creator` | ~240 | ~4.4k |
| `sdd-engineering:plan-verifier` | ~270 | ~4.1k |
| `sdd-engineering:run-plan` | ~200 | ~3.4k |
| `sdd-engineering:workflow-retro` | ~190 | ~3.2k |
| `sdd-engineering:implementer` | ~170 | ~2.7k |
| `sdd-engineering:engineering-insights` | ~170 | ~1.6k |
| `architecture-review:architecture-reviewer` | ~200 | ~3.6k |
| `engineering-paved-path:layered-architecture` | ~250 | ~2.8k |
| `engineering-paved-path:frontend-architecture` | ~210 | ~3.2k |
| `engineering-paved-path:skill-routing` | ~190 | ~2.4k |
| `research-tools:researcher` | ~170 | ~2.5k |

The always-on column is the one the shape of `engineering-paved-path@1.0.0`
turns on — it is what every consumer pays for a skill they never invoke. It is
also the column deduplication does **not** move: see the finding below.

## Scenario

| | |
|---|---|
| Feature under test | Round order totals to two decimal places — the spec at `evals/fixtures/no-test-script/specs/rounding.md`, two acceptance criteria |
| Prompt | "Use the `sdd-engineering:implementation-planner` agent to plan the spec at `specs/rounding.md` in this repository. When it returns, reply with only its summary." |
| Repository | `evals/fixtures/no-test-script` — a manifest declaring only `start` and `lint`, copied fresh for every run |
| Success predicate | The run wrote `specs/plans/rounding.md`. **A run that produced no plan does not count**; a cheaper arm that fails is not cheaper |
| Eval set | The six cases in `plugins/*/evals/` — see the Verdict |
| Runs per configuration | 3, median reported |
| Harness | `node scripts/measure-cost.mjs --config <scenario>` |

**Deviation from the method above, stated rather than hidden:** the scenario
plans an existing spec instead of also writing one. `spec-creator` opens with a
blocking clarification round, so a scenario that includes it measures how a
non-interactive run handles being unable to ask — which is a different thing
from what a spec-and-plan costs. The narrower scenario is the one the
deduplication actually touches.

## Baseline — the duplicated version

| | |
|---|---|
| Plugin | `sdd-engineering`, with the removed instructions restored inline |
| Version | `0.0.0`, reconstruction, never released |
| Commit SHA | reconstructed from `1f5ce52`; see *How the "before" arm exists at all* |
| Model | `opus` |
| Date | 2026-08-31 |

| Metric | Value |
|---|---|
| Input tokens | 6 (median) — everything else arrives through the cache |
| Output tokens | 2,544 (median) |
| Cache read tokens | 48,873 (median) |
| Cache write tokens | 12,297 (median) |
| API calls | 3 turns (median) |
| Tool calls | not captured — the harness reads the CLI's run summary, which does not break them out |
| Median cost per run | **$0.778** |
| Median latency | **203 s** |
| Pass rate | 3/3 runs produced `specs/plans/rounding.md` |
| Critical failures | none |

Individual runs: $0.778, $0.778, $0.752.

## The change

**One** change, chosen in advance: remove instructions duplicated between agent
prompts and skills, leaving the detail in skill references that load only when
needed.

Rationale: an agent prompt is loaded on every invocation; a skill reference is
loaded on demand. Duplicated text is paid for on every run, and the two copies
drift apart over time.

| | |
|---|---|
| What was removed | Eight instructions that appeared in more than one prompt, each given a single owner. Listed row by row in [`plugins/sdd-engineering/CHANGELOG.md`](../plugins/sdd-engineering/CHANGELOG.md) § Deduplicated |
| The three that this scenario exercises | The path → practice routing table (planner step 8 → `engineering-paved-path:skill-routing`); the layering rules in the planner's constraint table (→ `engineering-paved-path:layered-architecture`); the spec format and EARS paraphrased across agent prompts (→ `references/spec-format.md`) |
| Files touched | `plugins/sdd-engineering/agents/*.md`, `plugins/sdd-engineering/skills/run-plan/SKILL.md`, `plugins/sdd-engineering/references/host-configuration.md` |
| Commit SHA | `1f5ce52` (the extraction), `d8f18a0` (the two eval fixes) |

### How the "before" arm exists at all

The deduplication happened during the extraction, so the duplicated version was
never released and cannot simply be checked out. It is **reconstructed**: each
removed instruction is pasted back into `implementation-planner.md` verbatim
from the file that owns it today, and the planner is pointed at its own copy
instead of at the skill. That is the method the extraction plan prescribed when
it required the removals to be written down — *"step 8 compares a baseline
against the version with the duplication removed, and it cannot do that if
nobody wrote down what was removed."*

The reconstruction lives in a scratch directory and is never committed. It
raises the planner prompt from 17,254 to 26,910 bytes.

**The limitation, stated plainly:** because the "before" arm is rebuilt rather
than recovered, the delta measures *this* reconstruction, not a historical
artefact. It is faithful in that every restored block is the real text, but a
different reconstruction would give a different number.

### The finding that does not need a run

`claude plugin details` reports the same figure for both arms' **always-on**
cost: **~1,470 tok, unchanged**. Deduplication moves nothing there, because
always-on carries only names and descriptions.

What it moves is **on-invoke** for the one agent that carried the duplicates:

| | before | after | delta |
|---|---|---|---|
| `implementation-planner` on-invoke | ~9k tok | ~5.6k tok | **−3.4k tok, −38%** |

That is paid every time the planner fires and nothing else changes, so it is the
cleanest statement of what the optimization buys. Everything below asks the
different question of what it is worth in dollars on a real run.

## After — the shipped, deduplicated version

| | |
|---|---|
| Version | `0.0.0` as shipped on `feat/behavior-evals` |
| Commit SHA | `dfc6da3` |
| Model | same as baseline — `opus` |
| Date | 2026-08-31 |

| Metric | Baseline | After | Delta |
|---|---|---|---|
| Input tokens | 6 | 6 | — |
| Output tokens | 2,544 | 2,494 | −50 |
| Cache read tokens | 48,873 | 49,390 | **+517** |
| Cache write tokens | 12,297 | 12,927 | **+630** |
| API calls | 3 turns | 3 turns | — |
| Tool calls | not captured | not captured | — |
| Median cost per run | $0.778 | $0.822 | **+$0.044 (+5.7%)** |
| Median latency | 203 s | 229 s | +26 s |
| Pass rate | 3/3 | 3/3 | — |
| Critical failures | none | none | — |
| `implementation-planner` on-invoke | ~9k tok | ~5.6k tok | **−3.4k (−38%)** |

Individual runs: $0.822, $0.788, $0.871.

### Is +5.7% real?

No. The difference between the medians is **$0.044**; the shipped arm's own
run-to-run spread is **$0.083**. The difference is smaller than the noise in a
single arm, so with three runs per configuration this measurement cannot
distinguish the two on cost.

## Verdict

The optimization passes only if **all three** hold:

1. The quality gate is green — pass rate did not drop.
2. No new critical false negatives.
3. Cost or latency actually went down.

**Verdict: conditions 1 and 2 hold. Condition 3 does not. The optimization is
kept on other grounds, not on cost.**

1. **Quality gate green.** The six behaviour evals pass 6/6 on the shipped
   version, and both arms produced a plan in 3/3 runs.
2. **No new critical false negatives.** The opposite: the eval suite that
   accompanies this change *found* two real defects in the shipped prompts.
3. **Cost did not go down.** Median cost rose 5.7% and latency rose 26 s —
   both inside run-to-run noise, so the honest statement is **no measurable
   change in cost**, not a saving and not a regression.

### Why the static saving did not become a dollar saving

The 3.4k tokens are real and they left the planner's prompt. They did not leave
the run. This scenario is the case where deduplication cannot win: the planner
**needs** the routing table, so instead of carrying it, it now fetches it —
`engineering-paved-path:skill-routing` costs ~2.4k on invoke, plus the reference
reads. The work moved; it did not disappear, and the fetch has its own overhead.
Cache write went **up** by 630 tokens, which is what that relocation looks like.

Deduplication pays where this scenario does not exercise it:

- when the shared instruction is **not needed** on a given run, so it is never
  fetched at all;
- when **several agents in one run** would each have carried their own copy —
  the three-way verification-lane table, for instance, which a full
  `/run-plan` exercises and a plan-only scenario never touches.

The reason to keep the change is therefore the one the guidelines gave first and
this measurement does not weaken: **two copies drift.** That is a correctness
argument, and it stands on its own. Recording it as a cost win would have been
false.

### What the next optimization should test

Stated now so the next run is a measurement and not a fishing trip: the same
comparison over a **full `/run-plan`** rather than a planner-only scenario. That
is where the three-copy verification table lived, and it is the case where the
prediction — dedup wins when several agents would each carry the copy — is
falsifiable. If it does not win there either, the cost argument for
deduplication should be dropped from the guidelines and only the drift argument
kept.

## Which numbers are which

Every figure here is labelled as one of:

- **Measured** — read from a run's own usage report.
- **Reconciled** — cross-checked against provider billing for the same window.

Never present the first as the second.

## Log

| Date | Version | SHA | Change | Result |
|---|---|---|---|---|
| | | | | |
