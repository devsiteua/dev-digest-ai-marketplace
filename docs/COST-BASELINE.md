# Cost baseline

Cost per successful SDD workflow, measured before and after one optimization.

**Status: not yet measured.** This document is the template the measurement
fills in. Empty cells stay empty until there is a real number in them — an
estimate presented as a measurement is worse than no number.

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

## Scenario

| | |
|---|---|
| Feature under test | _TBD_ |
| Prompt | _TBD_ |
| Eval set | _TBD_ |
| Runs per configuration | _TBD_ |

## Baseline

| | |
|---|---|
| Plugin | `sdd-engineering` |
| Version | |
| Commit SHA | |
| Model | |
| Date | |

| Metric | Value |
|---|---|
| Input tokens | |
| Output tokens | |
| Cache read tokens | |
| Cache write tokens | |
| API calls | |
| Tool calls | |
| Median cost per run | |
| Median latency | |
| Pass rate | |
| Critical failures | |

## The change

**One** change, chosen in advance: remove instructions duplicated between agent
prompts and skills, leaving the detail in skill references that load only when
needed.

Rationale: an agent prompt is loaded on every invocation; a skill reference is
loaded on demand. Duplicated text is paid for on every run, and the two copies
drift apart over time.

| | |
|---|---|
| What was removed | _TBD_ |
| Files touched | _TBD_ |
| Commit SHA | |

## After

| | |
|---|---|
| Version | |
| Commit SHA | |
| Model | same as baseline |
| Date | |

| Metric | Baseline | After | Delta |
|---|---|---|---|
| Input tokens | | | |
| Output tokens | | | |
| Cache read tokens | | | |
| Cache write tokens | | | |
| API calls | | | |
| Tool calls | | | |
| Median cost per run | | | |
| Median latency | | | |
| Pass rate | | | |
| Critical failures | | | |

## Verdict

The optimization passes only if **all three** hold:

1. The quality gate is green — pass rate did not drop.
2. No new critical false negatives.
3. Cost or latency actually went down.

_Verdict: TBD._

If the difference is within run-to-run noise, write exactly that. Do not
manufacture a saving. A recorded "no measurable change" is a useful result; an
invented percentage is not.

## Which numbers are which

Every figure here is labelled as one of:

- **Measured** — read from a run's own usage report.
- **Reconciled** — cross-checked against provider billing for the same window.

Never present the first as the second.

## Log

| Date | Version | SHA | Change | Result |
|---|---|---|---|---|
| | | | | |
