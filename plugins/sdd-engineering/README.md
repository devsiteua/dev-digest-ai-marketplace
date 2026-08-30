# sdd-engineering

The spec-driven development workflow: write a specification, plan the
implementation against it, run the plan, and verify the result through an
independent review gate.

Four agents and three skills, sequencing **spec → plan → implement → verify**.
Nothing in it is autonomous: a human types each stage, and the pipeline refuses
rather than filling a gap it was not given.

## Contents

| Reference | Kind | Does |
|---|---|---|
| `sdd-engineering:spec-creator` | agent | Interrogates the caller, then writes one spec file. Never writes a plan or code. |
| `sdd-engineering:implementation-planner` | agent | Turns an approved spec into an ordered plan with a coverage table. Never edits a spec. |
| `sdd-engineering:implementer` | agent | Executes the plan step by step under the practices it names. Never re-plans, never commits. |
| `sdd-engineering:plan-verifier` | agent | Returns the `AC → task → test → commit` matrix. Writes nothing. |
| `sdd-engineering:run-plan` | skill | `/run-plan <plan>` — runs implementer → review → at most two fix iterations → verifier. |
| `sdd-engineering:workflow-retro` | skill | `/workflow-retro` — what a run cost and which file to change. Manual only. |
| `sdd-engineering:engineering-insights` | skill | Reads and appends the repository's insights journal. |

## The sequence

```
spec-creator ──► implementation-planner ──► /run-plan ──► /workflow-retro
   (human)              (human)              (human)         (human)
                                                │
                                  implementer ──┼──► architecture-reviewer
                                                │         │
                                                │    ≤2 fix iterations
                                                └──► plan-verifier
```

`/run-plan` may start exactly three agents — the implementer, the reviewer and
the verifier. It can never start the two that decide *what* to build. That is a
rule stated in the skill's own stage table, so a reviewer can check it by reading
one table.

## Install

```bash
claude plugin marketplace add devsiteua/dev-digest-ai-marketplace --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

Start a new session or run `/reload-plugins`, then verify:

```bash
claude plugin list --json
```

## Inputs

Resolved in this order, first hit wins: a value in the invocation →
`.claude/sdd-engineering.json` at the host repository root → the documented
default. **The configuration file is optional by design**: a repository that
accepts every default installs the plugin and runs, with no configuration step.

| Input | Default | Used by |
|---|---|---|
| `specDir` | `specs/` | spec-creator, implementation-planner, plan-verifier |
| `planDir` | `specs/plans/` | implementation-planner, run-plan, plan-verifier |
| `retroLedger` | `docs/retro/ledger.md` | workflow-retro |
| `architectureDocs` | discovered | implementation-planner, for constraints |
| `skillRouting` | `engineering-paved-path:skill-routing`'s own default map | implementation-planner, step 8 |
| `packages` | discovered from the workspace declaration, else the repository is one package | engineering-insights, implementer, plan-verifier |
| `commands.*` | discovered from the host manifest by conventional script name | implementer, plan-verifier, run-plan |

```jsonc
// .claude/sdd-engineering.json — every key optional
{
  "specDir": "docs/specs/",
  "planDir": "docs/specs/plans/",
  "retroLedger": "docs/retro/ledger.md",
  "packages": ["api", "web"],
  "commands": { "typecheck": "pnpm typecheck", "test": "pnpm test", "archCheck": null }
}
```

The full contract — every discovery order, every conventional name, and what
happens when each is absent — is
[`references/host-configuration.md`](references/host-configuration.md).

## No command is ever hardcoded

Every verification command is discovered from the host repository's manifest by
conventional script name, and run through the host's own package runner
(`packageManager`, then the lockfile, then `npm`).

**When a command is not found, the behavior is: say so and stop.** Never guess a
command, never substitute a similar one, never silently skip a step and report
success.

| Kind | Absent means |
|---|---|
| Required, and something asked for it — a type check or a test a plan step names | Report which command was looked for, in which manifest, and **stop**. A step whose `Verify:` cannot run is blocked, not finished. |
| Optional — architecture check, integration tests, migrations | Report `not run` and continue. An absent optional command is a documented state, not a failure. |
| Explicitly `null` in the configuration | The same, and no discovery is attempted. The repository has said it has none. |

A command that ran but could not complete — a service down, dependencies missing
— is reported as **not run**, never as passed. A guard is read by its **output**,
not its exit code. A test command reports its **test count**.

## The spec and plan format

The plugin carries its own: [`references/spec-format.md`](references/spec-format.md)
(the rules, where plans live, and the five EARS patterns) and
[`references/spec-template.md`](references/spec-template.md) (fifteen sections).

**A host repository overrides it.** If `<specDir>/README.md` or
`<specDir>/TEMPLATE.md` exists, that is the format and the plugin's own is not
consulted. Criteria are written in English unless the repository's instruction
file sets another language for requirements.

## What it writes, and where

Every path this plugin may write, exhaustively:

| Path | Written by | Created if absent? |
|---|---|---|
| `<specDir>/<slug>.md` | spec-creator | the directory, yes |
| `<planDir>/<slug>.md` | implementation-planner | the directory, yes |
| `<retroLedger>` | workflow-retro, by appending one entry | yes, with a header |
| the routed insights journal | engineering-insights, by appending | yes, with its seven sections |
| the files a plan step names | implementer | per the step |

It never commits, never pushes, never opens a pull request, and never writes to
an instruction file. `implementer` respects whatever do-not-touch list *this
repository* declares and **carries no such list of its own** — a path nobody
wrote down is not protected, and a path that was written down is not negotiable.

## Network and data

No component here has `WebSearch` or `WebFetch`. External research is delegated
to `research-tools:researcher` by the caller. Nothing is sent anywhere: discovery,
planning, review and verification all happen in the session you already started.

**One declared exception.** `/workflow-retro deep` reads this session's own Claude
Code logs under the user's `~/.claude/projects/` directory — outside the host
repository. It is local, read-only, the user's own data, it happens only when the
caller types `deep`, the skill names the directory before reading it, and the
transcripts are aggregated by
[`skills/workflow-retro/scripts/analyze_journals.py`](skills/workflow-retro/scripts/analyze_journals.py)
so that only totals reach the model's context. Nothing leaves the machine.

## Tool grants

| Agent | Tools | Why |
|---|---|---|
| `spec-creator` | Read, Grep, Glob, Write, Edit, Skill, TodoWrite | Writing a requirement runs no command, so it has no `Bash`. |
| `implementation-planner` | Read, Grep, Glob, Write, Skill, TodoWrite | No `Edit`, so it cannot amend the spec it is planning. No `Bash`: discovering a command means reading the manifest, not running it. |
| `implementer` | Read, Edit, Write, Grep, Glob, Bash, Skill, TodoWrite | The only agent that may edit and execute. |
| `plan-verifier` | Read, Grep, Glob, Bash, TodoWrite | No `Skill`, deliberately — a loaded quality skill turns a compliance check into a code review. `Bash` runs the verification commands and writes nothing. |

Two absences are load-bearing and are stated as process, not promise: the planner
has no `Edit`, and the verifier has no `Skill`.

## Dependencies

```
sdd-engineering
├── engineering-paved-path@^1.0.0    the practices, and the path → practice map
├── research-tools@^1.0.0            delegated read-only discovery
└── architecture-review@^1.0.0       the independent review gate
    └── engineering-paved-path@^1.0.0
```

Dependencies are installed automatically by the plugin installer.

| Edge | The call that creates it |
|---|---|
| → `engineering-paved-path` | `implementation-planner` step 8 routes with `engineering-paved-path:skill-routing`. It carries no routing table of its own; without the skill the step has no source and the planner would invent one. |
| → `research-tools` | `spec-creator` and `implementation-planner` delegate discovery rather than reading the repository themselves. Discovery must not be able to edit. |
| → `architecture-review` | `run-plan`'s review gate. A verdict from the agent that wrote the code is not a review. |
