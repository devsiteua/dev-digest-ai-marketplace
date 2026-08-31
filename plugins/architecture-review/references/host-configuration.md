# Host configuration

How `architecture-review` learns about the repository it is installed in. Two
things are resolved at run time and neither is hardcoded: **where the
architecture documentation is**, and **which command checks the architecture
mechanically**.

Nothing here is required. A repository that accepts every default installs the
plugin and runs it with no configuration step.

## Resolution order

For every input, the first hit wins:

1. A value given in the invocation.
2. The `.claude/sdd-engineering.json` file at the host repository root, if it
   exists. It is the shared configuration file for this marketplace, named after
   the workflow plugin that introduced it; a repository that installs only
   `architecture-review` uses the same file with only the keys below.
3. The documented default.

```jsonc
// .claude/sdd-engineering.json — every key optional
{
  "architectureDocs": ["docs/architecture.md", "docs/adr/"],
  "commands": {
    "archCheck": "pnpm arch:check"
  }
}
```

A malformed configuration file is reported and the run stops. A file that parses
but names a path that does not exist is reported as a finding — a repository that
points at documentation it does not have is a fact worth stating, not a reason to
guess.

## Input: `architectureDocs`

The repository's own statement of how it is meant to be built. This is the
reviewer's primary source of rules; the general dependency rule from
`engineering-paved-path:layered-architecture` is the only rule that applies
without it.

**Default: discovered.** In order, and every hit is collected rather than only
the first:

| Order | Looked for |
|---|---|
| 1 | `docs/architecture.md`, `ARCHITECTURE.md`, `docs/ARCHITECTURE.md` |
| 2 | `docs/architecture/**/*.md` |
| 3 | `docs/adr/**/*.md`, `docs/decisions/**/*.md`, `adr/**/*.md` |
| 4 | The architecture section of the root instruction file — `CLAUDE.md`, `AGENTS.md` — and of `CONTRIBUTING.md` |
| 5 | Per-package instruction files, for packages in scope |

**When nothing is found**, the behavior is fixed and must be reported, not
worked around:

- Say so in the report header: `Architecture docs: none found — searched <paths>`.
- Review against the general dependency rule from
  `engineering-paved-path:layered-architecture` and nothing else.
- Every axis that would need a repository-specific rule goes under **Not
  checked**, naming the rule that was missing.
- Do not infer a rule from the code's current shape. Code is evidence of what a
  repository does, never of what it intended; a reviewer that derives the rule
  from the thing under review always returns "clean".

## Input: the architecture check command

A mechanical guard — dependency-cruiser, ESLint boundaries, an import linter, an
ArchUnit-style test. **Optional.** Most repositories do not have one.

**Discovery.** Read the host repository's manifest and look for a script whose
name is conventional for this job. For `package.json` `scripts`, in order:

```
arch:check · arch · architecture · lint:arch · depcruise · dep:check · boundaries
```

For another ecosystem, read that ecosystem's manifest for the equivalent task
name. Run it through the host's own package runner, discovered in this order:

| Source | Runner |
|---|---|
| `packageManager` field in `package.json` | the manager it names |
| `pnpm-lock.yaml` | `pnpm` |
| `yarn.lock` | `yarn` |
| `bun.lockb`, `bun.lock` | `bun` |
| `package-lock.json`, nothing else | `npm` |

**When no such script exists**, the behavior is fixed:

- Report `Guard: not found — no architecture check script in <manifest>`.
- Continue the review. An absent optional command is a documented state, not a
  failure, and not a reason to stop.
- Never substitute a command that looks similar. A lint script is not an
  architecture check, and running it and reporting it as one is worse than
  reporting nothing.

**When the script exists but cannot run** — dependencies not installed, a
non-zero exit that is a crash rather than a violation — that is a **finding**, at
`WARNING`. A guard that is configured and broken is not the same as a guard that
was never there.

**Read the output, never the exit code.** Architecture linters routinely
configure rules at warning severity, and a warning-severity rule exits 0 on a
real violation. Report what the output said.
