# Plugin guidelines

How a plugin in this marketplace is built. [CONTRIBUTING.md](../CONTRIBUTING.md)
covers the mechanics of opening a pull request; this document covers the design
decisions behind a plugin.

## What belongs in a plugin

A plugin is a unit of **ownership and release**, not a folder of related files.
Before adding a component, answer three questions:

1. **Owner** — who reviews a change to it?
2. **Consumer scenario** — which workflow breaks if it is missing?
3. **Release coupling** — why should it ship on the same version as the rest of
   this plugin?

If a component has a different owner, or a consumer that does not use the rest
of the plugin, or a reason to release on its own schedule, it belongs in a
different plugin.

The answers for every component in the first extraction are recorded in
[COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md).

## Boundaries in this marketplace

| Plugin | Boundary |
|---|---|
| `engineering-paved-path` | Practice-level technical guidance with no workflow opinion. Anything that says *how we write React* rather than *what to do next*. |
| `research-tools` | Read-only discovery. No writes, no workflow state. |
| `architecture-review` | An independent quality gate that can be invoked outside SDD. |
| `sdd-engineering` | The workflow itself: the agents and skills that sequence spec → plan → implement → verify. |

A leaf plugin (`engineering-paved-path`, `research-tools`) must never depend on a
workflow plugin. That direction of dependency is what keeps the graph acyclic.

## Anatomy

```
plugins/<name>/
├── .claude-plugin/plugin.json
├── agents/<agent>.md
├── skills/<skill>/SKILL.md
│                 ├── references/
│                 ├── scripts/
│                 └── assets/
├── commands/<command>.md
├── hooks/
├── evals/
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

`plugin.json` is the source of truth for what the plugin contains. The
`marketplace.json` entry carries only `name`, `source` and catalog metadata.

## Manifest

```json
{
  "name": "sdd-engineering",
  "version": "1.0.0",
  "description": "One sentence, shown in the catalog and in claude plugin list.",
  "author": { "name": "AI Engineering" },
  "homepage": "https://devsiteua.github.io/dev-digest-ai-marketplace/#/plugin/sdd-engineering",
  "license": "MIT",
  "keywords": ["sdd", "spec-driven", "workflow"],
  "dependencies": [
    { "name": "engineering-paved-path", "version": "^1.0.0" },
    { "name": "research-tools", "version": "^1.0.0" },
    { "name": "architecture-review", "version": "^1.0.0" }
  ]
}
```

`name` must equal the directory name and the `marketplace.json` entry name.
A mismatch is the most common cause of `no-matching-tag` at install time.

## Namespacing

Components from a dependency are always addressed by their fully qualified name:

```
engineering-paved-path:react-best-practices
research-tools:researcher
architecture-review:architecture-reviewer
```

Use the full name for a plugin's own components too, wherever the field expects
a plugin-scoped reference. An unqualified name resolves against whatever the
host repository happens to have installed, which is exactly the coupling this
marketplace exists to remove.

## Paths

| Use | For |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}` | Files at the plugin level — evals, shared references, top-level scripts |
| `${CLAUDE_SKILL_DIR}` | Scripts, references and assets inside a skill |

Never write an absolute path. Never assume the host repository has a `server/`,
an `apps/`, a `pnpm-workspace.yaml` or any other particular layout.

## Explicit inputs instead of assumptions

An extracted component usually carries silent assumptions about the repository it
came from. Replace each one with a documented input:

- **Where specs and plans are written.** State the default path, state that it is
  configurable, and state what happens if the directory does not exist.
- **How tests are run.** Do not hardcode `pnpm test`. Describe how the command is
  discovered, and describe the behavior when no test command is found — that
  behavior must be *report and stop*, never *guess and run*.
- **Where architecture documentation lives.** Same pattern: input, default,
  documented fallback.

## Tools and permissions

Review the tool grant of every agent during extraction, not after. Grant the
minimum the agent's job requires:

- A researcher gets read and search tools only.
- A reviewer gets read, search and the ability to write its report — nothing that
  edits the code under review.
- An implementer is the only agent that gets edit and execute tools.

A tool grant that was safe inside a single trusted repository is not
automatically safe once the plugin is installed somewhere else.

## No duplicated instructions

If an instruction appears in both an agent prompt and a skill, delete it from the
agent prompt and let the skill be the one source. Every agent prompt is loaded
into context on every invocation; a skill reference is loaded when it is needed.
The reason is **drift**: two copies of an instruction diverge, and nobody
notices which one an agent actually followed.

It was also the first optimization measured in
[COST-BASELINE.md](COST-BASELINE.md), and the measurement did **not** support the
token argument that used to be made here. Removing 3.4k tokens from
`implementation-planner`'s prompt cut its on-invoke cost by 38%, but the cost of
a real planner run did not move: the planner needs the instruction, so it now
fetches what it used to carry, and the fetch has its own overhead. Median cost
went up 5.7%, inside run-to-run noise.

So deduplicate for correctness, and expect a saving only where the shared
instruction is genuinely **not needed** on a given run, or where **several agents
in one run** would each have carried a copy. Claiming a token saving for it in
the general case is not supported by the one measurement this repository has.

## Documentation each plugin owes

- `README.md` — what it is, what it installs, how to invoke it, its dependencies
  and the install command.
- `CHANGELOG.md` — [Keep a Changelog](https://keepachangelog.com/) format,
  newest first, one section per released version.
- `COMPATIBILITY.md` — the minimum Claude Code version and the specific feature
  that requires it. The floor for this marketplace is **2.1.110**, because it
  uses version-constrained plugin dependencies. If you use a newer capability,
  name it and raise the floor to the version the official documentation gives.

## Validation

```bash
claude plugin validate ./plugins/<name>
claude plugin validate .
```

There is no `--strict` flag in the documented command; do not add one.

Schema validation checks the shape of the files. It cannot tell you whether the
composition does the intended work — that is what behavior evals are for, and
both levels are required before a release.
