# Extraction plan — step 4

The work order for building the four plugins. What each component becomes, what
changes in it, and how to tell it is finished.

The decisions behind it are already made: boundaries and composition in
[COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md), edges and names in
[DEPENDENCY-GRAPH.md](DEPENDENCY-GRAPH.md). This document does not reopen them.
It is deleted once step 4 lands.

Source, read-only, never modified: `../dev-digest/.claude/`.

## The contract that shapes every edit

Extraction is not copying. Each component silently assumes it is running inside
DevDigest, and each assumption becomes one of three things:

**1. An explicit input.** Four paths and one map are supplied by the host
repository. Every one has a documented default and a documented behavior when it
is absent.

| Input | Default | Used by |
|---|---|---|
| `specDir` | `specs/` | `spec-creator`, `implementation-planner`, `plan-verifier` |
| `planDir` | `specs/plans/` | `implementation-planner`, `run-plan`, `plan-verifier` |
| `retroLedger` | `docs/retro/ledger.md` | `workflow-retro` |
| `architectureDocs` | discovered — see below | `architecture-reviewer` |
| `skillRouting` | the plugin's own default map | `implementation-planner` step 8 |

They are resolved in this order, and the first hit wins:

1. A value given in the invocation.
2. `.claude/sdd-engineering.json` at the host repository root, if present.
3. The documented default above.

The config file is optional by design. A repository that accepts every default
installs the plugin and runs, with no configuration step — and a repository that
does not can say so in one file rather than in every prompt.

**2. A discovered command.** No verification command is ever hardcoded.

| Was | Becomes |
|---|---|
| `pnpm typecheck` | the typecheck script, discovered |
| `pnpm test` | the test script, discovered |
| `pnpm arch:check`, `pnpm arch:check:all` | the architecture check, discovered, **optional** |
| `pnpm db:generate`, `pnpm db:migrate` | migration commands, discovered, **optional** |
| `pnpm exec <tool>` | the host's package runner, discovered |

Discovery reads the host repository's manifest — `package.json` `scripts`, or the
equivalent for its ecosystem — and picks by conventional name. The package runner
comes from `packageManager`, a lockfile, or falls back to `npm`.

**When a command is not found, the behavior is: say so and stop.** Never guess a
command, never substitute a similar one, never silently skip the step and report
success. An optional command that is absent is reported as not run, and the
workflow continues; a required one that is absent stops the workflow.

This is the single most important rule in this document. An agent that invents
`pnpm test` in a repository that uses `cargo test` is worse than one that refuses.

**3. Deleted.** Everything that is only true of DevDigest.

| Removed | Why |
|---|---|
| `server/`, `client/`, `reviewer-core/` as known packages | Packages are discovered, not known |
| `server/CLAUDE.md`, `client/CLAUDE.md` | The host's per-package instructions, wherever they are |
| `server/INSIGHTS.md`, `client/INSIGHTS.md` | Resolved by `engineering-insights`, which discovers packages |
| `server/.dependency-cruiser-known-violations.json` | A DevDigest baseline file |
| `client/src/vendor/ui/`, `server/src/db/migrations/` | DevDigest's do-not-touch list. The host has its own, or none |
| `@devdigest/*`, `mcp__devdigest__*` | DevDigest package and MCP tool names |
| `server/clones/`, `server/test/readonly` | DevDigest directories |

## Tool grants

Reviewed per agent, at extraction time. A grant that was safe inside one trusted
repository is not automatically safe once the plugin is installed elsewhere.

| Agent | Now | After | Change |
|---|---|---|---|
| `researcher` | Read, Grep, Glob, **Bash**, WebSearch, WebFetch, TodoWrite | Read, Grep, Glob, WebSearch, WebFetch, TodoWrite | **Bash dropped** — see below |
| `spec-creator` | Read, Grep, Glob, **Bash**, Write, Edit, Skill, TodoWrite, **4 MCP tools** | Read, Grep, Glob, Write, Edit, Skill, TodoWrite | MCP tools dropped; Bash dropped — writing a spec runs no command |
| `implementation-planner` | Read, Grep, Glob, **Bash**, Write, Skill, TodoWrite | Read, Grep, Glob, Write, Skill, TodoWrite | Bash dropped — command *discovery* reads a manifest, it does not run anything |
| `implementer` | Read, Edit, Write, Grep, Glob, Bash, Skill, TodoWrite | unchanged | The only agent that may edit and execute |
| `plan-verifier` | Read, Grep, Glob, Bash, TodoWrite | unchanged | Bash is needed to run tests and read git history; it writes nothing |
| `architecture-reviewer` | Read, Grep, Glob, Bash, Skill, TodoWrite | unchanged | Read-only with a command to run; proposes no patch |

### Why `researcher` loses Bash

In DevDigest its read-onlyness is enforced twice: by its prompt, and by
`scripts/readonly-agent-guard.sh`, a `PreToolUse` hook in `.claude/settings.json`.

That hook does not come along. It lives in the DevDigest repository, and a plugin
does not install hooks into a host repository's settings. So after extraction the
only thing standing between `researcher` and a write is its own prompt — and
`Bash` can write: `>`, `tee`, `sed -i`, `git checkout`.

[SECURITY.md](SECURITY.md) makes the tool grant the boundary rather than the
prompt. A read-only agent must actually be unable to write. Grep and Glob cover
every read `researcher` genuinely needs.

This is the one behavior change in an otherwise faithful extraction of a
component with zero DevDigest references, and it is deliberate.

## Per-component work

Reference counts are `grep` hits for DevDigest-specific tokens in the source file.

### `research-tools`

| | |
|---|---|
| `agents/researcher.md` | from `agents/researcher.md` · **0 refs** |

The only component that needs no editorial pass. Copy, then apply the tool-grant
change above and say why in the plugin README.

**Done when:** the agent runs in a repository with no `package.json` and returns
a report rather than an error, and it has no tool that can write.

### `architecture-review`

| | |
|---|---|
| `agents/architecture-reviewer.md` | from `agents/architecture-reviewer.md` · **27 refs** |

The hard part is not the names, it is the *shape*: the agent currently knows a
three-package layout and a specific dependency-cruiser baseline.

- `pnpm arch:check` ×4, `arch:check:all` ×2 → the discovered, optional
  architecture check. Absent is a documented state, not a failure.
- `server/` ×3, `client/` ×2, `reviewer-core/` ×2 → discovered packages.
- `server/.dependency-cruiser-known-violations.json` → deleted.
- `server/INSIGHTS.md`, `server/test/readonly` → deleted.
- The ring-order and dependency-direction checks are stated in
  `engineering-paved-path:layered-architecture`. The agent applies the rule and
  does not restate it — this is also the duplication the cost baseline measures.
- `architectureDocs`: read the host's own architecture documentation. Discovery
  order and the behavior when there is none must both be written down.

**Done when:** run against a repository with architecture docs and no
`arch:check` script, it produces findings from the docs and reports the missing
check as not run.

### `engineering-paved-path`

Three skills, per [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md).

| Skill | From | Refs |
|---|---|---|
| `layered-architecture` | `skills/onion-architecture/` | **44** |
| `frontend-architecture` | `skills/frontend-architecture/` | **25** |
| `skill-routing` | §3 of `skills/pr-self-review/SKILL.md` | new |

`layered-architecture` is the largest single piece of work in step 4 and is
honestly a rewrite: the dependency rule is general, every example, package name
and tool invocation carrying it is not. Keep the rule, replace the evidence.
`pr-self-review` itself is **not** extracted — only §3.

`skill-routing` is what makes the graph work. `implementation-planner` step 8
currently reads §3 by path. After extraction it reads this skill, which carries a
default map and takes the host's own via `skillRouting`. Its default must degrade
honestly: an unknown path maps to no practice, and the plan step says so, rather
than being assigned the nearest-looking skill.

**Done when:** no skill mentions a DevDigest package, and `skill-routing` returns
an empty result for an unrecognised path instead of a guess.

### `sdd-engineering`

| Component | From | Refs | Principal edits |
|---|---|---|---|
| `agents/spec-creator.md` | same | 7 | Drop 4 `mcp__devdigest__*` tools and `pnpm db:`. `specs/plans/<same-slug>.md` → `planDir`. |
| `agents/implementation-planner.md` | same | 21 | `specs/plans/<slug>.md` ×3 → `planDir`. `server/CLAUDE.md` ×2, `client/CLAUDE.md` → the host's per-package instructions. `reviewer-core` ×3, `client/src/vendor/ui/`, `server/src/db/migrations/`, `server/src/db/seed.ts` → deleted. `pnpm arch:check`, `db:migrate`, `db:generate` → discovered and optional. Step 8 reads `engineering-paved-path:skill-routing`. |
| `agents/implementer.md` | same | 26 | `pnpm typecheck` ×2, `pnpm test`, `pnpm exec` ×2, `pnpm arch:check` ×2, `pnpm db:generate` → discovered. `server/`, `reviewer-core/`, `server/clones/`, `server/src/db/*` → deleted. Two literal `DevDigest` mentions in the prose. |
| `agents/plan-verifier.md` | same | 12 | `pnpm typecheck` ×2, `pnpm test`, `pnpm exec` ×2, `arch:check` ×3, `pnpm db:migrate` → discovered. `server/INSIGHTS.md`, `reviewer-core` → deleted. `specs/plans/<slug>.md` → `planDir`. |
| `skills/run-plan/` | `skills/implement/` | 19 | **Renamed.** `arch:check` ×5, `pnpm typecheck` ×3, `pnpm test` ×2 → discovered. `specs/plans/` ×4 → `planDir`. `server/INSIGHTS.md`, `reviewer-core` → deleted. The review gate becomes `architecture-review:architecture-reviewer`. |
| `skills/workflow-retro/` | same | 3 | Cheapest. `docs/retro/ledger.md` ×3 → `retroLedger`. See the script note below. |
| `skills/engineering-insights/` | same | 6 | `server/`, `client/`, `reviewer-core/` and their `INSIGHTS.md` → discovered packages. This discovery is what "generalized" means for this skill. |

#### The `workflow-retro` script

The lab's acceptance list checks that
`workflow-retro/scripts/analyze_journals.py` uses `${CLAUDE_SKILL_DIR}`. The
source skill is a single `SKILL.md` with no `scripts/` directory at all.

Either the script is written here — in which case `${CLAUDE_SKILL_DIR}` applies
from its first line — or it is not, and the report says the criterion was
satisfied vacuously. Do not create an empty file to tick a box.

## Deduplication

Removing instructions duplicated between an agent prompt and a skill is both a
guideline and the change [COST-BASELINE.md](COST-BASELINE.md) measures.

**Record what you remove as you go**, in the pull request: which instruction,
which agent prompt, which skill now owns it. Step 8 compares a baseline against
the version with the duplication removed, and it cannot do that if nobody wrote
down what was removed.

Known overlaps to check: `run-plan` and `implementer` on running verification;
`architecture-reviewer` and `layered-architecture` on the dependency rule;
`implementation-planner` and `plan-verifier` on `AC-NN` coverage.

## Per-plugin documentation

Each of the four gets, beyond what step 1 scaffolded:

- `CHANGELOG.md` — Keep a Changelog, an `Unreleased` section until step 9.
- `COMPATIBILITY.md` — Claude Code `>=2.1.110`, because this marketplace uses
  version-constrained dependencies. If you use something newer, name it and raise
  the floor to the version the official documentation gives.
- `README.md` — extend the scaffold: inputs, their defaults, what happens when a
  command is not found.

## Finished when

- `claude plugin validate .` and `claude plugin validate ./plugins/<name>` pass
  for all four.
- `npm run build:index` resolves the graph and reports only unreleased-range
  notes.
- Both security greps from [SECURITY.md](SECURITY.md) come back empty.
- `git grep -niE 'devdigest|reviewer-core|arch:check|pnpm ' -- plugins/` returns
  nothing but deliberate prose.
- Every plugin reads only files inside its own directory or its dependencies.
- The plugins load together and behave:

```bash
claude \
  --plugin-dir ./plugins/engineering-paved-path \
  --plugin-dir ./plugins/research-tools \
  --plugin-dir ./plugins/architecture-review \
  --plugin-dir ./plugins/sdd-engineering
```

- Run in a repository that is **not** DevDigest and does not use pnpm: the
  workflow either runs or reports precisely which command it could not find.
  Nothing is guessed.

## Starting prompt for a fresh session

> Read `CLAUDE.md` and `docs/EXTRACTION-PLAN.md`. Steps 1–3 are done; do step 4 —
> extract the components from `../dev-digest/.claude/` into the four plugins,
> applying the editorial pass in the plan. Work on a branch off
> `docs/extraction-plan`. Everything in English. Start with `research-tools`,
> which needs no editorial pass, then `architecture-review`, then
> `engineering-paved-path`, then `sdd-engineering`.
