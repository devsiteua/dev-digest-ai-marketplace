# Host configuration

How the `sdd-engineering` components learn about the repository they are
installed in. Four paths, one map, a set of commands and the package list are
resolved at run time. **None of them is hardcoded, and none of them is guessed.**

Nothing here is required. A repository that accepts every default installs the
plugin and runs the workflow with no configuration step.

## Resolution order

For every input, the first hit wins:

1. A value given in the invocation.
2. `.claude/sdd-engineering.json` at the host repository root, if it exists.
3. The documented default below.

```jsonc
// .claude/sdd-engineering.json — every key optional
{
  "specDir": "specs/",
  "planDir": "specs/plans/",
  "retroLedger": "docs/retro/ledger.md",
  "architectureDocs": ["docs/architecture.md"],
  "skillRouting": { "rules": [] },
  "packages": ["api", "web"],
  "commands": {
    "typecheck": "pnpm typecheck",
    "test": "pnpm test",
    "testIntegration": null,
    "archCheck": "pnpm arch:check"
  }
}
```

A malformed configuration file is **reported and the run stops**. A key naming a
path that does not exist is reported where it is used; whether that stops the run
depends on the path — see each input below.

A command explicitly set to `null` means *this repository does not have one*. That
is a statement, and it is honoured: the command is reported as unavailable and
never discovered around.

## Paths

| Input | Default | Used by |
|---|---|---|
| `specDir` | `specs/` | `spec-creator`, `implementation-planner`, `plan-verifier` |
| `planDir` | `specs/plans/` | `implementation-planner`, `run-plan`, `plan-verifier` |
| `retroLedger` | `docs/retro/ledger.md` | `workflow-retro` |
| `architectureDocs` | discovered — see `architecture-review` | `implementation-planner`, for constraints |

**When the directory does not exist.** `specDir` and `planDir` are **created** when
something writes into them, and their creation is stated in the writer's report.
They are the only directories this plugin creates.

For a single-package repository `planDir` sits inside `specDir` — `specs/plans/`
beside `specs/`. For a repository whose work is scoped to one package, a spec may
live at `<package>/specs/` with its plan at `<package>/specs/plans/`; the plan
always keeps its spec's slug and always sits in a `plans/` directory beside it.

`retroLedger` is different: it is a file, and **if it does not exist it is
created with the header the retro skill carries**, then appended to. A retro never
rewrites an existing ledger.

## Commands

**No verification command is ever hardcoded.** Every one is discovered from the
host repository's manifest by conventional name.

| Key | Conventional script names, in order | Kind |
|---|---|---|
| `typecheck` | `typecheck`, `type-check`, `types`, `check-types`, `tsc` | required **when asked for** |
| `test` | `test`, `tests`, `test:unit`, `unit` | required **when asked for** |
| `testIntegration` | `test:integration`, `test:it`, `integration`, `it` | optional |
| `lint` | `lint`, `lint:check` | optional |
| `build` | `build`, `compile` | optional |
| `archCheck` | `arch:check`, `arch`, `architecture`, `lint:arch`, `depcruise`, `boundaries` | optional |
| `migrationGenerate` | `db:generate`, `migrate:generate`, `migration:generate`, `makemigrations` | optional |
| `migrationApply` | `db:migrate`, `migrate`, `migrate:up`, `db:push` | optional |

For an ecosystem without `package.json`, read that ecosystem's own task
definitions — a `Makefile`, `pyproject.toml`, `Cargo.toml`, `build.gradle`, a
`justfile` — and match the same conventional task names.

### The package runner

Never write a package manager's name into a command. Discover it:

| Source | Runner |
|---|---|
| `packageManager` field in `package.json` | the manager it names |
| `pnpm-lock.yaml` | `pnpm` |
| `yarn.lock` | `yarn` |
| `bun.lockb`, `bun.lock` | `bun` |
| `package-lock.json`, or nothing conclusive | `npm` |

Running a binary directly — a test runner, a type checker — goes through that
runner's exec form (`pnpm exec`, `yarn exec`, `bunx`, `npx`). Do not assume one.

### When a command is not found

This is the most important rule in this document. **Never guess a command, never
substitute a similar one, never silently skip a step and report success.**

| Kind | Absent means |
|---|---|
| **Required, and something asked for it** | Say which command was looked for, in which manifest, and **stop**. A plan step whose `Verify:` cannot run is a blocked step, not a finished one. |
| **Optional** | Report it as `not run — no <key> command in <manifest>` and continue. An absent optional command is a documented state, not a failure. |
| Explicitly `null` in the configuration | The same as optional-and-absent, and no discovery is attempted. |

An agent that invents `pnpm test` in a repository that uses `cargo test` is worse
than one that refuses. A green report that skipped the check it claims to have run
is worse still.

**Substitution is the subtler failure, and it applies to every command here, not
just the architecture check.** A repository that declares `lint` and no `test` has
no test command; naming `lint` where a test was asked for — even with an honest
caveat beside it — puts a command that cannot fail the way a test fails into the
slot a test was meant to occupy. The caveat stays in the prose; the command
travels on. Report the absence and use the documented empty form.

### Reading a command's result

- **A guard is read by its output, not by its exit code.** Architecture and lint
  tools routinely carry rules at warning severity, and a warning-severity rule
  exits 0 on a real violation.
- **A test command that passes with no tests proves nothing.** Report the test
  count alongside the result.
- **A command that could not run** — a missing service, a container runtime that
  is down, dependencies not installed — is reported as **not run**, never as
  passed and never as failed.
- **A failure that predates this run** is reported as `pre-existing`, with the
  evidence that it predates the change. It is not fixed: that is scope nobody
  granted.

## Packages

Several components work per package. The package list is **discovered**, never
known:

| Order | Looked for |
|---|---|
| 1 | `packages` in `.claude/sdd-engineering.json` |
| 2 | A workspace declaration — `pnpm-workspace.yaml`, `workspaces` in `package.json`, `go.work`, `[workspace] members` in `Cargo.toml`, a Gradle `settings` file, `turbo.json` |
| 3 | Directories holding their own manifest, one level under a conventional container (`packages/`, `apps/`, `services/`, `libs/`) |
| 4 | Nothing found → the repository is **one package**, its root |

A single-package repository is the normal case, not a degraded one. Every
per-package instruction below reads as "the repository" there.

## Per-package instructions

Where a repository states its own conventions. Discovered, in this order:

| Order | Looked for |
|---|---|
| 1 | The root instruction file — `CLAUDE.md`, then `AGENTS.md` |
| 2 | The same filename at the root of each package in scope |
| 3 | `CONTRIBUTING.md`, and a `docs/` conventions document if one is named from the root instruction file |
| 4 | An accumulated-insights file — see `sdd-engineering:engineering-insights` for how that file is routed and named |

**When a repository has none of these**, that is reported once per run and the
work continues against the code and the spec alone. Nothing is invented to fill
the gap: a convention nobody wrote down is not a constraint, and a plan that
cites one cannot be argued with.

## Things this plugin will never do

- Read outside the host repository, except files inside its own plugin directory
  or its dependencies'.
- Write outside `specDir`, `planDir`, `retroLedger` and the insights files the
  `engineering-insights` skill routes to — every one of them documented in the
  plugin README.
- Reach the network. No component here has `WebSearch` or `WebFetch`; external
  research is delegated to `research-tools:researcher` by the caller.
- Commit, push, or open a pull request.
