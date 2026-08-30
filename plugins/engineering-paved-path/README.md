# engineering-paved-path

Shared technical skills for TypeScript engineering teams. This plugin is the
single source for practice-level guidance — React, testing, Fastify, Drizzle,
PostgreSQL, Zod, TypeScript, architecture, security and Mermaid — so that the
same instructions are not copied into every agent that needs them.

**Status: scaffold.** Skills are extracted in a follow-up pull request.

## Contents

Planned for 1.0.0 — three skills, each with a named consumer:

| Skill | Consumed by |
|---|---|
| `layered-architecture` | `architecture-review:architecture-reviewer` |
| `frontend-architecture` | `sdd-engineering:implementation-planner` |
| `skill-routing` | `sdd-engineering:implementation-planner`, when it assigns each plan step a practice |

Only skills with a real consumer are included. A long "just in case" list
inflates discovery context and support burden for everyone who installs a plugin
that depends on this one, and no extracted component names a technical skill by
name — the coupling runs through `skill-routing`. See
[docs/COMPONENT-INVENTORY.md](../../docs/COMPONENT-INVENTORY.md).

The remaining technical skills in the source repository are vendored from
third-party repositories or have no recorded provenance. They ship once their
upstream licenses are checked and attribution is recorded, not before.

## Usage

Skills are referenced by their namespaced name:

```
engineering-paved-path:react-best-practices
```

## Install

```bash
claude plugin install engineering-paved-path@dev-digest-ai-marketplace --scope project
```
