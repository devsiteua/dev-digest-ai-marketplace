# Changelog

All notable changes to `engineering-paved-path` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this plugin
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.0] — 2026-08-31

Released from `main` at `431f55d`, tagged `engineering-paved-path--v1.0.0`. CI green on that
exact commit.

**Release gate.** Behaviour evals green before the tag: **6/6 cases, $2.27**,
three of them negative. Run with `npm run eval`.


### Added

- `skill-routing` — a new skill, extracted from §3 of a pre-pull-request gate
  that is not published here. It maps a list of paths to the practices that
  govern them, takes the host repository's map through `skillRouting`, and ships
  a deliberately small default. An unrecognised path is reported as **unmatched**
  and assigned no practice; a named skill that is not installed is dropped and
  reported rather than substituted.
- `layered-architecture` — the layered/ports-and-adapters dependency rule, with
  the ring table, the placement table, seven forbidden import directions, how to
  declare an exception, and `references/enforcement.md` on making the rule
  machine-checked.
- `frontend-architecture` — thirteen placement rules with five reference files,
  carried over from the source skill.

### Changed

- **`layered-architecture` is a rewrite of the source `onion-architecture` skill,
  not a copy.** The dependency rule is unchanged; the evidence carrying it is
  entirely new. Ring names and roles are stated abstractly and the ring-to-path
  mapping is discovered from the host repository, with an inferred mapping
  labelled *proposed* rather than treated as fact. Forbidden imports are stated
  as directions — "a persistence library outside the persistence layer" — rather
  than as package names.
- **The architecture check is no longer a command in the skill.** The source
  named `pnpm arch:check`, `arch:check:all` and `arch:baseline` and a specific
  baseline file. `references/enforcement.md` now covers guards across seven
  ecosystems, the baseline discipline, guard coverage, and the exit-code trap: a
  warning-severity rule exits 0 on a real violation, so consumers read the output
  rather than `$?`.
- **`frontend-architecture` rule 4 of "How to use"** points at whatever
  conventions the host repository keeps, instead of at one repository's profile
  file.

### Removed

- The source `onion-architecture` skill's `tooling.md`. Its content was one
  repository's stack — a specific web framework, ORM, validation library, adapter
  set and test runner — expressed as the dependency rule applied to each. The
  rule survives in `SKILL.md`; the stack did not travel. Its nine-item backend
  review checklist is not restated here either: applying the rule to a diff is
  `architecture-review:architecture-reviewer`'s job, and that agent now carries
  the checklist as its axes.
- `frontend-architecture`'s `references/devdigest-profile.md` — a description of
  one repository's local dialect, which belongs to that repository.
- Named references to the technical skills that are not published in this
  version. They are named as boundaries only, so the scope stays legible.
