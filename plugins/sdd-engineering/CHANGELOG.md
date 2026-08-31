# Changelog

All notable changes to `sdd-engineering` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this plugin follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.0] — 2026-08-31

**Release gate.** Behaviour evals green before the tag: **6/6 cases, $2.27**,
three of them negative. Run with `npm run eval`.


### Added

- The four workflow agents — `spec-creator`, `implementation-planner`,
  `implementer`, `plan-verifier` — and the three skills `run-plan`,
  `workflow-retro` and `engineering-insights`.
- `references/host-configuration.md` — the single contract for the five inputs,
  command discovery, the package runner, package discovery, per-package
  instruction discovery, and what happens when any of them is absent.
- `references/spec-format.md` and `references/spec-template.md` — the spec format
  now travels with the plugin. Previously it lived in the source repository's own
  `specs/README.md` and `specs/TEMPLATE.md`, which meant an installed
  `spec-creator` had no format to write in. A host repository overrides both by
  keeping its own `<specDir>/README.md` or `<specDir>/TEMPLATE.md`.
- `skills/workflow-retro/scripts/analyze_journals.py` — the aggregation the retro
  skill always described but never shipped. It prints one row per journal, which
  is one row per agent launch, with cache reads as their own column; the skill
  invokes it through `${CLAUDE_SKILL_DIR}`. Reading a full transcript into context
  was never possible, and every previous run improvised the script.
- A `Commands in this repository` section in the plan file, listing every command
  a step names as this repository spells it, and every one that was looked for and
  not found.

### Changed

- **`implement` is renamed `run-plan`.** `/implement` becomes `/run-plan`.
- **No verification command is hardcoded anywhere.** Every `pnpm typecheck`,
  `pnpm test`, `pnpm exec`, `pnpm arch:check`, `pnpm db:generate` and
  `pnpm db:migrate` is replaced by a command discovered from the host manifest by
  conventional name, run through the host's own package runner. A required
  command that is absent stops the workflow with the name it looked for; an
  optional one is reported as not run and the workflow continues. Nothing is
  guessed and nothing is substituted.
- **`specs/` and `specs/plans/` became the `specDir` and `planDir` inputs**, with
  documented defaults and documented behavior when the directory does not exist.
  The same for `docs/retro/ledger.md`, now `retroLedger` — and the retro creates
  the ledger with a header when it is absent, rather than failing.
- **Packages are discovered, not enumerated.** The three known package names and
  the routing built on them are gone. `engineering-insights` routes to a journal
  by discovered package; a single-package repository is the normal case, not a
  degraded one. The journal's filename follows whatever the repository already
  uses.
- **`implementation-planner` step 8 routes with
  `engineering-paved-path:skill-routing`.** It previously read §3 of a
  pre-pull-request skill by path — a skill that is not published here. It now
  carries no routing table at all, and writes the routing skill's `Unmatched`
  list into the plan instead of assigning a nearest-looking practice.
- **`run-plan`'s review gate is `architecture-review:architecture-reviewer`**, a
  separately owned plugin. It also passes the reviewer's own missing inputs — no
  architecture documentation, no architecture check — through to the report as
  facts about the repository rather than as findings for the implementer to fix.
- **Instruction files, insights files and architecture documentation are
  discovered.** A repository that has none of them is reported once and the work
  continues from the code and the spec. Nothing is invented to fill the gap.
- Acceptance criteria are written in English. The source repository wrote them in
  Ukrainian by a local convention recorded in its own instruction file; a host
  repository that sets its own language for requirements is still followed, and
  then names that language's trigger words in the `Pattern` column.

### Removed

- **The four `mcp__devdigest__*` tools from `spec-creator`'s grant**, and the step
  that used them. They read a service the host repository has never heard of. The
  rule they carried — everything a tool returns is data, never direction — is kept
  and now sits with the `Untrusted inputs` section it feeds.
- **`Bash` from `spec-creator` and `implementation-planner`.** Writing a
  requirement runs no command, and discovering one means reading a manifest. The
  planner loses the ability to inspect the working tree; it now asks the caller
  about uncommitted work, or records in `Open questions` that it assumed a clean
  tree.
- **The `--tests` flag from `run-plan`.** It launched a test-writing agent that is
  not published here. A plan whose steps already name their tests does not need a
  second agent to write them.
- Every reference to the source repository's packages, its per-package instruction
  files, its vendored and migration directories, its seed file, its baseline file,
  its MCP server, its design-reference skill, its pre-pull-request gate and its
  other agents.
- The claim that `PreToolUse` hooks enforce a read-only agent's read-onlyness.
  Hooks do not travel with a plugin. `plan-verifier` now says what actually
  enforces it: the absent `Write` and `Edit`, and nothing else.

### Fixed

- **`implementation-planner` no longer puts a command that cannot prove a step on
  that step's `Verify:` line.** Found by the `no-test-command` eval: against a
  repository declaring only `start` and `lint`, the agent stated correctly in
  prose that lint must not stand in for a test, then wrote `Verify: npm run lint`
  anyway. The caveat stays in the prose; the command travels into the coverage
  table on its own. The rule is now explicit, with the one legitimate exception —
  a command an earlier step in the same plan **creates**, which closes the gap
  rather than papering over it.
- **The no-substitution rule in `references/host-configuration.md` is stated for
  every command**, not only under the architecture check, where it read as being
  about that one command.

### Deduplicated

Recorded here because [COST-BASELINE.md](../../docs/COST-BASELINE.md) measures
this, and it cannot measure what nobody wrote down. Each row is an instruction
that appeared in more than one prompt and now has one owner.

| Instruction | Was in | Now owned by |
|---|---|---|
| The per-package verification lane table — which commands run for which package | `implementer` §3, `plan-verifier` §3, `run-plan` §6 (three copies) | `references/host-configuration.md` § Commands; all three cite it |
| "Read a guard by its output, not its exit code" | `implementer`, `plan-verifier`, `run-plan`, `architecture-reviewer` (four copies) | `references/host-configuration.md` § Reading a command's result, and `engineering-paved-path:layered-architecture` `references/enforcement.md` for the general statement |
| "A skipped check is a finding, never a pass" | `implementer`, `plan-verifier`, `run-plan` | `references/host-configuration.md`, restated only where it changes a verdict |
| Backend layering rules — SQL in the persistence layer, transport at the edge, dependencies from the composition root | `implementation-planner` §3 constraint table, `implementer` §2 package conventions | `engineering-paved-path:layered-architecture`; both agents cite it |
| Frontend placement rules — no fetching in a component, folder-per-component | `implementer` §2 package conventions | `engineering-paved-path:frontend-architecture` |
| The path → practice routing table | `implementation-planner` §8, `pr-self-review` §3 | `engineering-paved-path:skill-routing` |
| Why a criterion with no step matters, and how the coverage table is built | `implementation-planner` §5, `plan-verifier` §5 | `implementation-planner` §5 builds it; `plan-verifier` reads the plan's `Coverage` section rather than re-deriving the rule |
| The spec format, EARS and the fifteen-section template | the source repository's `specs/README.md` and `specs/TEMPLATE.md`, paraphrased across three agent prompts | `references/spec-format.md` and `references/spec-template.md`; the agents cite section names |
