# Enforcement — making the dependency rule fail the build

A layering rule that lives only in a document is a rule that is broken quietly. This file is
about turning the rule in `SKILL.md` into something mechanical.

Nothing here is required to use the skill. A repository with no guard applies the rule by
review; a repository with a guard applies it on every commit and reviews the design instead
of the imports.

## What a guard can and cannot do

A guard checks **directions between paths**. It cannot check whether a service is doing too
much, whether the domain is anemic, or whether an exception is justified. Rings 1, 3, 5 and
6 of the forbidden-import list are mechanically checkable; the placement table and the
"keep it proportional" section are not.

Configure the guard for what it can decide, and leave the rest to review. A guard that tries
to encode judgement produces false positives, and a rule with false positives gets
suppressed.

## Tools, by ecosystem

| Ecosystem | Tool | Checks |
|---|---|---|
| TypeScript / JavaScript | `dependency-cruiser` | forbidden `from` → `to` path rules, with a baseline of known violations |
| TypeScript / JavaScript | `eslint-plugin-boundaries`, `import/no-restricted-paths` | element types and the allowed edges between them, in the lint run |
| Python | `import-linter` | layered contracts, forbidden contracts, independence contracts |
| Java / Kotlin | ArchUnit | layer access rules as ordinary tests |
| Go | `go-arch-lint`, `depguard` | component graphs and package-level import bans |
| .NET | NetArchTest | the same, as tests |
| Rust | `cargo-deny`, crate boundaries | dependency direction between crates |

The choice matters less than the fact that it runs in CI and blocks a merge.

## Writing the rules

State each rule as a direction with a reason attached, because the reason is what a
developer reads when the guard fires:

```
name:     no-orm-outside-persistence
comment:  Query building lives in the persistence layer. A query elsewhere means the
          repository is no longer the only place data shapes exist.
from:     everything except the persistence layer, the schema module and the entry point
to:       the ORM package
severity: error
```

Two things to get right:

- **Match how the resolver actually reports a path.** A package dependency is commonly
  reported through its installed location rather than by its bare name, so a rule written
  against the bare name can silently match nothing. Verify a new rule fires by breaking the
  code on purpose once.
- **A rule that has never fired is not proven.** Write the violation, watch it go red,
  revert.

## The exit-code trap

**Read the output, never the exit code.**

Guards commonly allow a rule to be configured at warning severity — a pragmatic setting for
a rule being introduced gradually. A warning-severity rule **exits 0 on a real violation**.
A pipeline step that only checks `$?` therefore reports green on the exact violation the
rule was written to catch.

Anything that consumes a guard — CI, a review agent, a plan verification step — asks the
stronger question: *did the output name a violation?* Not: *did it exit 0?*

The same applies in reverse. A non-zero exit that is a crash — dependencies not installed,
a configuration file not found, the wrong working directory — is not a clean run and is not
a violation either. Report it as a guard that could not run, which is itself a finding.

## Baselines and existing debt

Introducing a guard into a codebase that already violates it is the normal case. Every tool
above supports some form of baseline: a frozen list of existing violations the guard
suppresses, so new violations fail while old ones do not.

Three rules make a baseline useful instead of a laundry chute:

1. **Never add an entry to unblock yourself.** If a change trips the guard, either move the
   code to the right ring, or say out loud why the rule is wrong. A baseline that grows is a
   rule being repealed one commit at a time.
2. **Clear entries opportunistically.** When a task touches a file that is in the baseline,
   fix it and regenerate. Do not launch a standalone cleanup refactor.
3. **A baseline is a debt list, not a rulebook.** A violation found there is reported as
   pre-existing debt, separately from new findings — it is neither clean nor a new problem.

Regenerating the baseline is a deliberate act after a cleanup, never a step in an ordinary
change.

## Coverage is part of the guard's honesty

A guard usually covers some of the repository and not all of it — one package configured, a
second added later, a third never. Where the guard does not reach, the rule still applies
and is checked by hand.

Write down which paths are covered, next to the guard's configuration. A missing
architecture guard is **reported, never assumed clean**, and a reviewer who cannot tell
covered from uncovered will assume the wrong one.
