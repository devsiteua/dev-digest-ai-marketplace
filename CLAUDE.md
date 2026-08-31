# CLAUDE.md

A Claude Code plugin marketplace. It packages the reusable part of the DevDigest
engineering harness — the spec-driven development workflow, its agents, and the
practices they rely on — so any repository can install them.

## Where you are in the work

Eleven steps, from an empty repository to a rehearsed rollback. **All eleven are
done and on `main`.**

| Step | What | State |
|---|---|---|
| 1 | Repository skeleton | done — `feat/repo-skeleton` |
| 2 | Sort DevDigest components into portable / project-specific / integrations / residue | done — `docs/component-inventory` |
| 3 | Dependency graph, namespaces, range rules | done — `feat/dependency-graph` |
| 4 | Build the four plugins: extract and edit the components | done — `feat/extract-plugins` |
| 5 | Register the plugins in `marketplace.json` | done ahead of time in step 1 |
| 6 | Static catalog on GitHub Pages | done — live at <https://devsiteua.github.io/dev-digest-ai-marketplace/> |
| 7 | `claude plugin validate` and behavior evals | done — `feat/behavior-evals` |
| 8 | Cost baseline and one optimization | done — `feat/cost-baseline`. Measured; the optimization did **not** reduce cost, and that is the recorded result |
| 9 | Release `sdd-engineering@1.0.0` | done — four tags at `431f55d`, CI green on that commit |
| 10 | Install into an unrelated project | done — [docs/INSTALL-TRACE.md](docs/INSTALL-TRACE.md) |
| 11 | Update to 1.1.0, rehearse the return to 1.0.0 | done — `architecture-review@1.1.0` released; the rehearsal rewrote the path back in [docs/RELEASES.md](docs/RELEASES.md) |

## Read these before changing anything

Decisions are recorded, not remembered. If you are about to re-derive one, it is
probably already written down.

| Document | Answers |
|---|---|
| [docs/COMPONENT-INVENTORY.md](docs/COMPONENT-INVENTORY.md) | What was extracted, what stayed in DevDigest, and why. Every component, with its owner and consumer scenario. |
| [docs/DEPENDENCY-GRAPH.md](docs/DEPENDENCY-GRAPH.md) | The four edges, namespaced references, allowed version ranges. |
| [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md) | Plugin anatomy, manifest fields, path variables, tool grants. |
| [docs/SECURITY.md](docs/SECURITY.md) | What may never appear in a plugin. |
| [docs/RELEASES.md](docs/RELEASES.md) | SemVer, tag convention, channels, and the way back to an earlier version. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Where files go and what to run before pushing. |
| [docs/INSTALL-TRACE.md](docs/INSTALL-TRACE.md) | The step 10 evidence: installing 1.0.0 into a project that is not this one, and what the trace does and does not prove. |
| [evals/README.md](evals/README.md) | The eval case format, the fixtures, and why this repository runs its own runner instead of `claude plugin eval`. |

## What the plugins ship

Twelve components, all six agents and six skills the dependency graph names.
`npm run build:index` reports the same count.

| Plugin | Components |
|---|---|
| `research-tools` | `researcher` |
| `architecture-review` | `architecture-reviewer` |
| `engineering-paved-path` | `layered-architecture`, `frontend-architecture`, `skill-routing` |
| `sdd-engineering` | `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`, `run-plan`, `workflow-retro`, `engineering-insights` |

Each plugin's `README.md` states its inputs and what happens when one is missing;
its `CHANGELOG.md` records what the extraction changed and, for
`sdd-engineering`, which duplicated instruction now has which single owner.

## The source components

They are read from a sibling repository and never modified:

```
../dev-digest/.claude/agents/     9 agents
../dev-digest/.claude/skills/    17 skills
```

Extraction copies from there into `plugins/`. Nothing in this repository writes
to `../dev-digest`.

The lab that drives this work is `../dev-digest/reference/lessons/L08/L08-lab.md`,
with the stream brief at `../dev-digest/reference/lessons/kickoff/L08.md`.

## Layout

```
.claude-plugin/marketplace.json   catalog entries — name and source only
plugins/<name>/                   plugin.json is the source of truth for contents
docs/                             decisions and policy
scripts/build-index.mjs           builds the catalog index; resolves the graph first
scripts/graph.mjs                 dependency resolution and its checks
site/                             React + TypeScript + Vite catalog UI
.github/workflows/                validate (pull requests), pages (deploy)
```

## Commands

```bash
npm run build:index                       # generate the index; fails on a bad graph
claude plugin validate .                  # the marketplace manifest
claude plugin validate ./plugins/<name>   # one plugin — the marketplace check does not cover these
cd site && npm ci && npm run build        # catalog UI
cd site && npm run preview                # serve the built catalog locally

npm run eval:dry                          # every eval case parses — costs nothing
npm run eval                              # behavior evals, for real — costs money
npm run measure:cost -- --config <file>   # two-arm cost comparison, median of N runs
```

`build:index` must run before the site build: the catalog reads
`site/public/{index,releases,stats}.json` and `site/public/bodies/`, none of
which are committed.

`claude plugin validate .` validates **only** the marketplace manifest, not the
plugins it lists. Both are needed; CI runs both.

There is no `--strict` flag on `claude plugin validate`, and there is no
`claude plugin rollback` command. Do not invent either.

**`claude plugin eval` exists and is the right long-term home for the evals, but
it is gated behind early access** and refuses to run for this account. Its case
schema is not documented outside the tool, so `evals/run.mjs` is a stand-in that
runs the same cases today. Do not write cases against a guessed `case.yaml`.

## Conventions

- `${CLAUDE_PLUGIN_ROOT}` for plugin-level files, `${CLAUDE_SKILL_DIR}` for files
  inside a skill. Never an absolute path.
- Components are addressed by namespaced reference:
  `engineering-paved-path:skill-routing`, `research-tools:researcher`.
- Caret ranges for dependencies. An exact pin only to route around a broken
  release, with an issue open to remove it.
- **No command is ever hardcoded in a plugin.** Every verification command is
  discovered from the host repository's manifest by conventional name. Absent and
  required: say which command, and stop. Absent and optional: report not run, and
  continue. Never guess, never substitute.
- Host configuration is one optional file at the host root,
  `.claude/sdd-engineering.json`. Every key has a documented default, so a
  repository that accepts them all needs no configuration step.
- Every plugin manifest was at `0.0.0` until step 9 and is now at `1.0.0`. The
  caret ranges always named the version they would be tagged with, so
  `build:index` reported an unsatisfied range against an unreleased dependency as
  a note; those notes are gone now that all four are at `1.0.0`.
- Generated files — `site/public/{index,releases,stats}.json`,
  `site/public/bodies/`, `site/dist/` — are never committed.

## Branch stack

Nothing is pushed yet. Each branch is one reviewable pull request, stacked:

```
main
└── feat/repo-skeleton          PR #1
    └── docs/component-inventory      PR #2
        └── feat/dependency-graph         PR #3
            └── docs/extraction-plan          PR #4
                └── feat/extract-plugins          PR #5
                    └── feat/catalog-site              PR #6
                        └── feat/behavior-evals            PR #7
                            └── feat/cost-baseline             PR #8
                                └── feat/release-1.0.0             PR #9
```

**CI does not run yet, and that is not a misconfiguration.** GitHub registers a
repository's workflows from its default branch, and `main` is still the initial
commit — it carries no `.github/`. Merging PR #1 puts the workflows on `main`,
after which `validate` runs on every open pull request.

## Released

`1.0.0` for all four plugins, tagged at `431f55d`, and `architecture-review@1.1.0`
at `2e2659e` — each on `main` with CI green on that commit. The catalog is live at
<https://devsiteua.github.io/dev-digest-ai-marketplace/>.

```bash
claude plugin marketplace add devsiteua/dev-digest-ai-marketplace
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

**A tag is permanent. Never move one that has been pushed** — a consumer may
already have resolved it. Going back to an earlier version is an install from a
pinned channel, not a moved tag; there is no `claude plugin rollback` command.

The path back was **rehearsed on 2026-08-31 and did not work as written**. What
it found, and the corrected procedure, are in
[docs/RELEASES.md](docs/RELEASES.md) § Going back to a previous version. The
short version: a marketplace name is bound to one source, so there is no second
`-stable` channel; and removing the channel uninstalls **every** plugin that came
from it, not just the one being rolled back.

## One open question, deliberately deferred

Ten of the technical skills in DevDigest are vendored from third-party GitHub
repositories or have no recorded provenance, and none carries a license or
attribution. Republishing them from a public MIT marketplace is a licensing
question. They are excluded from `engineering-paved-path@1.0.0` for that reason
and do not block it. See the provenance section of
[docs/COMPONENT-INVENTORY.md](docs/COMPONENT-INVENTORY.md).
