# dev-digest-ai-marketplace

A Claude Code plugin marketplace. It packages the reusable part of the DevDigest
engineering harness — the spec-driven development (SDD) workflow, its supporting
agents and the technical skills they rely on — so that any repository can install
them without copying files by hand.

The marketplace is deliberately **not** part of the DevDigest product repository.
The product and the team harness have different owners and different release
cadences: a UI change in DevDigest must not ship a new skill version, and a skill
fix must not require a release of the whole product.

## Plugins

| Plugin | What it is | Depends on |
|---|---|---|
| `engineering-paved-path` | Shared technical skills (React, TypeScript, testing, Fastify, Drizzle, PostgreSQL, Zod, architecture, security, Mermaid) | — |
| `research-tools` | Generic read-only `researcher` agent for delegated discovery | — |
| `architecture-review` | Generalized `architecture-reviewer` that reads repository-local architecture docs | `engineering-paved-path` |
| `sdd-engineering` | The SDD workflow: `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier` plus the `run-plan`, `workflow-retro` and `engineering-insights` skills | all three above |

```
sdd-engineering
├── engineering-paved-path
├── research-tools
└── architecture-review
    └── engineering-paved-path
```

> **Status:** the plugin directories are scaffolded but not yet populated.
> Component extraction lands in a follow-up pull request.

## Install

```bash
claude plugin marketplace add devsiteua/dev-digest-ai-marketplace --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

Dependencies are resolved and installed automatically. Verify with:

```bash
claude plugin list --json
```

Then start a new session or run `/reload-plugins`.

## Catalog

A static catalog is published to GitHub Pages for discovery — search for a plugin
or an individual skill, read its documentation, see its dependencies and copy the
install command. The CLI remains the way to install.

## Repository layout

```
.claude-plugin/marketplace.json   catalog entries (source + metadata only)
plugins/<name>/                   one directory per plugin, plugin.json is the source of truth
docs/                             contribution, site, security, release and cost policy
scripts/build-index.mjs           builds the catalog index consumed by the site
site/                             React + TypeScript + Vite catalog UI
.github/workflows/                validate (pull requests) and pages (deploy)
```

## Local development

```bash
npm run build:index                       # generate site/public/{index,releases,stats}.json
cd site && npm ci && npm run build && npm run preview
```

Generated JSON and `site/dist/` are never committed.

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — how to open a pull request
- [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md) — plugin anatomy and manifest fields
- [docs/COMPONENT-INVENTORY.md](docs/COMPONENT-INVENTORY.md) — which components were extracted, which stayed behind, and why
- [docs/SITE-SPEC.md](docs/SITE-SPEC.md) — catalog routes, index shape and search
- [docs/SECURITY.md](docs/SECURITY.md) — what a plugin may never contain
- [docs/RELEASES.md](docs/RELEASES.md) — SemVer, tags, channels and rollback
- [docs/COST-BASELINE.md](docs/COST-BASELINE.md) — measured cost per successful workflow

## Requirements

Claude Code `>= 2.1.110` — this marketplace uses version-constrained plugin
dependencies.

## License

[MIT](LICENSE)
