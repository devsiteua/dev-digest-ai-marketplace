# Compatibility

## Claude Code

**Minimum: 2.1.110.**

This plugin declares version-constrained dependencies on three other plugins,
which is the capability that sets the floor for this marketplace. Nothing else in
it needs a newer version: agent and skill files with frontmatter, plugin-level
references read through `${CLAUDE_PLUGIN_ROOT}`, and one skill script invoked
through `${CLAUDE_SKILL_DIR}`.

## Dependencies

All three must be installed; the installer resolves them.

| Plugin | Needed for |
|---|---|
| `engineering-paved-path@^1.0.0` | `implementation-planner` step 8 routes with `skill-routing`; the planner and implementer cite `layered-architecture` and `frontend-architecture` |
| `research-tools@^1.0.0` | the discovery `spec-creator` and `implementation-planner` delegate rather than doing themselves |
| `architecture-review@^1.0.0` | `run-plan`'s review gate |

`engineering-paved-path` is reached twice — directly, and through
`architecture-review`. Both edges carry `^1.0.0`, so both resolve to one installed
copy. Ranges that no single version satisfies are a `range-conflict` at install
time; see [docs/RELEASES.md](../../docs/RELEASES.md) for the release ordering that
prevents one.

## Reading the plugin's own files

The agents read reference files from `${CLAUDE_PLUGIN_ROOT}`, which resolves to
the installed plugin directory — outside the project you are working in. In an
interactive session Claude Code asks once for permission to read there and
remembers the answer. In a non-interactive run (`claude -p`) with a restrictive
permission mode, that read is denied without a prompt: the components then fall
back on the general behavior described in their own prompts and **say in the
report that the reference could not be read**. Allow the plugin directory, or run
with a permission mode that permits it, if you want the documented discovery
order rather than the general one.

## Host repository

| Expectation | Required? |
|---|---|
| `.claude/sdd-engineering.json` | No. Every key has a documented default. |
| A spec or plan directory | No. Both are created when something writes into them. |
| A spec format of its own | No. The plugin carries one; `<specDir>/README.md` or `<specDir>/TEMPLATE.md` overrides it. |
| A package manifest | No — but without one no command can be discovered, so every verification step reports `not found` and any step that needed one is blocked. |
| A test or type-check command | No, until a plan step asks for one. Then its absence stops that step rather than being guessed around. |
| An architecture check | No. Optional everywhere; absent is reported as not run. |
| Migration tooling | No. Optional; a repository without it simply gets no migration step. |
| Instruction, insights or architecture documents | No. Their absence is reported once and the work continues from the code and the spec. |
| A specific package manager | No. `pnpm`, `yarn`, `bun` and `npm` are discovered, with `npm` as the fallback. |
| A specific ecosystem | No. For a repository without `package.json`, the same conventional task names are read from a `Makefile`, `pyproject.toml`, `Cargo.toml`, a Gradle build or a `justfile`. |
| Version control | Yes, in practice. `implementer`, `plan-verifier` and `run-plan` read the diff to scope and attribute a change. |
| Python 3 | Only for `/workflow-retro deep`, which uses `analyze_journals.py`. Every other part of the plugin runs without it. |

## Network

None. No component has `WebSearch` or `WebFetch`, and nothing sends repository
content anywhere.

`/workflow-retro deep` reads local Claude Code session logs under the user's
`~/.claude/projects/` directory — outside the host repository, only on an explicit
`deep`, read-only, aggregated to totals before anything reaches the model's
context. It is declared in the plugin README and it is the only such read.
