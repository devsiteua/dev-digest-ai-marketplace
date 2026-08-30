# Contributing

This repository publishes Claude Code plugins that other repositories install.
A bad merge here breaks somebody else's session, so the bar is: **anyone should
be able to open a correct pull request without asking in chat where files go or
what to run.** If you had to ask, that is a bug in this document — fix it in the
same pull request.

## Where things go

| You are changing | Put it in |
|---|---|
| A skill | `plugins/<plugin>/skills/<skill-name>/SKILL.md` |
| An agent | `plugins/<plugin>/agents/<agent-name>.md` |
| A slash command | `plugins/<plugin>/commands/<command-name>.md` |
| A hook | `plugins/<plugin>/hooks/` |
| A behavior eval | `plugins/<plugin>/evals/` |
| Plugin metadata, version, dependencies | `plugins/<plugin>/.claude-plugin/plugin.json` |
| A new plugin's catalog entry | `.claude-plugin/marketplace.json` |
| Catalog UI | `site/src/` |
| Catalog index generation | `scripts/build-index.mjs` |
| Policy (release, security, cost) | `docs/` |

Nothing that a plugin needs at runtime may live outside that plugin's directory
or one of its declared dependencies.

## Plugin structure

```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json        manifest — the source of truth for the plugin's contents
├── agents/                one Markdown file per agent
├── skills/<skill>/        SKILL.md plus references/, scripts/, assets/
├── commands/              one Markdown file per slash command
├── hooks/
├── evals/                 behavior evals for this plugin
├── README.md              what it is, what it installs, how to use it
├── CHANGELOG.md           Keep a Changelog format, newest first
└── COMPATIBILITY.md       minimum Claude Code version and why
```

## Manifest fields

`plugins/<name>/.claude-plugin/plugin.json`:

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Must equal the directory name and the `marketplace.json` entry name |
| `version` | yes | SemVer. See [docs/RELEASES.md](docs/RELEASES.md) |
| `description` | yes | One sentence, shown in the catalog and in `claude plugin list` |
| `author` | yes | `{ "name": ... }` |
| `homepage` | recommended | Deep link into the published catalog |
| `license` | recommended | `MIT` unless there is a reason to differ |
| `keywords` | recommended | Drives catalog search |
| `dependencies` | when applicable | `[{ "name": ..., "version": "^1.0.0" }]` |

`.claude-plugin/marketplace.json` carries **only** `name` and `source` (plus
catalog metadata). Do not restate a plugin's version or component list there —
`plugin.json` is the single source of truth, and duplicating it means every
release touches two files that can silently disagree.

## Dependency rules

The graph and the reasoning behind each edge are in
[docs/DEPENDENCY-GRAPH.md](docs/DEPENDENCY-GRAPH.md).

- Depend on a plugin, never on a file inside another plugin.
- Use caret ranges (`^1.0.0`). Pin an exact version only to work around a known
  broken release, and open an issue to remove the pin.
- Reference components from dependencies by their namespaced name:
  `engineering-paved-path:react-best-practices`, `research-tools:researcher`,
  `architecture-review:architecture-reviewer`.
- No dependency cycles. `engineering-paved-path` and `research-tools` are leaves
  and must stay that way.
- Adding a dependency is a minor version bump for the consumer. Removing one, or
  widening what a consumer requires, is a major bump.

## Path and environment rules

- `${CLAUDE_PLUGIN_ROOT}` for plugin-level files.
- `${CLAUDE_SKILL_DIR}` for scripts and references inside a skill.
- Never an absolute path, never a path that assumes the host repository's layout.
- If a component needs to know where something lives in the host repository, take
  it as an explicit input and document the default and the fallback behavior.

See [docs/SECURITY.md](docs/SECURITY.md) for the full prohibition list.

## Checks

Run all of these before pushing:

```bash
claude plugin validate ./plugins/<name>     # one plugin
claude plugin validate .                    # the marketplace and every plugin

npm run build:index                         # catalog index must generate
cd site && npm ci && npm run build          # catalog UI must build
```

Load the plugins directly to check behavior, not just shape:

```bash
claude \
  --plugin-dir ./plugins/engineering-paved-path \
  --plugin-dir ./plugins/research-tools \
  --plugin-dir ./plugins/architecture-review \
  --plugin-dir ./plugins/sdd-engineering
```

Schema validation checks the shape of the files. Behavior evals check that the
composition does the intended work. Both levels are required.

## Pull request checklist

- [ ] `claude plugin validate .` passes
- [ ] `npm run build:index` and the site build pass
- [ ] Manifest `name` matches the directory name and the `marketplace.json` entry
- [ ] `version` bumped according to [docs/RELEASES.md](docs/RELEASES.md), or
      explicitly unchanged because nothing shipped
- [ ] `CHANGELOG.md` updated for every plugin whose version changed
- [ ] No secrets, credentials, absolute paths, or references to a specific
      repository's layout
- [ ] `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_SKILL_DIR}` used instead of relative
      guesses
- [ ] Components from dependencies referenced by namespaced name
- [ ] Instructions are not duplicated between an agent prompt and a skill
- [ ] Behavior evals added or updated for changed behavior, including a negative
      eval where the workflow must *not* trigger
- [ ] Generated files (`site/public/*.json`, `site/public/bodies/`, `site/dist/`)
      are not in the diff

## Review and merge

`CODEOWNERS` requires a review from the owning team on every path. Manifests and
release policy are never self-merged. Releases are tagged only from commits that
passed CI — see [docs/RELEASES.md](docs/RELEASES.md).
