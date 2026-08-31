# Changelog

All notable changes to `architecture-review` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this plugin
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.0] — 2026-08-31

Released from `main` at `431f55d`, tagged `architecture-review--v1.0.0`. CI green on that
exact commit.

**Release gate.** Behaviour evals green before the tag: **6/6 cases, $2.27**,
three of them negative. Run with `npm run eval`.


### Added

- The `architecture-reviewer` agent: read-only architectural review of existing
  code, returning a verdict, grounded findings, pre-existing debt, the axes
  checked clean and the axes not checked.
- `references/host-configuration.md` — the discovery contract for
  `architectureDocs` and the architecture check command, including the behavior
  when each is absent.
- Eight review axes, each of which requires a written rule before it can produce
  a finding. An axis with no rule is reported as **Not checked** rather than
  becoming either a finding or a clean result.

### Changed

- **Architecture documentation is discovered, not known.** The source agent read
  one repository's `docs/architecture.md` and its per-package insights files by
  path. The agent now discovers documentation, and when there is none it reviews
  against the general dependency rule alone and says so in the report header.
- **The architecture check is discovered and optional.** `pnpm arch:check` and
  `pnpm arch:check:all` are replaced by a script discovered from the host
  manifest by conventional name and run through the host's own package runner.
  Not found is reported and the review continues; a similar-looking script is
  never substituted.
- **Packages are discovered, not enumerated.** The three known package names and
  the zone table built on them are replaced by zones — backend, frontend — that
  map to skills rather than to directories.
- **The dependency rule is cited, not restated.** Ring order and import direction
  now live only in `engineering-paved-path:layered-architecture`; the agent loads
  it and applies it. This is the duplication [COST-BASELINE.md](../../docs/COST-BASELINE.md)
  measures.
- The baseline/known-violations file is a discovered repository practice rather
  than one named path, and the rule against proposing additions to it survives.

### Removed

- Every reference to one repository's packages, its dependency-cruiser baseline
  file, its insights files and its guard-script test.
- The claim that a `PreToolUse` hook enforces read-onlyness. Hooks do not travel
  with a plugin; the README says what actually enforces it now.
- References to the source repository's other agents and its pre-pull-request
  gate, none of which are published here.
