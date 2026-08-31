# engineering-paved-path

Shared engineering practices, stated once. This plugin is the single source for
practice-level guidance so that the same rules are not copied into every agent
that needs them — an agent cites a skill here rather than restating it.

It is a **leaf**: it depends on nothing, and it never depends on a workflow
plugin. A repository that wants the layering rule without the spec-driven
workflow is a normal consumer.

## Contents

Three skills, each with a named consumer. Released in 1.0.0.

| Skill | Answers | Consumed by |
|---|---|---|
| `engineering-paved-path:layered-architecture` | Which ring may import which; where a piece of server-side code belongs; what a violation looks like | `architecture-review:architecture-reviewer` |
| `engineering-paved-path:frontend-architecture` | Where a component, hook, route, type or test goes; where the client boundary sits | `sdd-engineering:implementation-planner`, `architecture-review:architecture-reviewer` |
| `engineering-paved-path:skill-routing` | Given a list of paths, which practices apply to each — and which paths no practice governs | `sdd-engineering:implementation-planner`, when it assigns each plan step a practice |

## Why three and not eleven

Only skills with a real consumer are included. Every skill description loads on
every session of every plugin that depends on this one, so a long "just in case"
list is a cost paid by everyone and used by no one.

The measurement behind that: no extracted agent or workflow skill names a
technical skill directly. The entire coupling between the workflow and the
practices runs through `skill-routing`, which is why a routing mechanism was
needed rather than a catalogue. See
[docs/COMPONENT-INVENTORY.md](../../docs/COMPONENT-INVENTORY.md).

The remaining technical skills in the source repository — React, testing,
Fastify, Drizzle, PostgreSQL, Zod, TypeScript, security and Mermaid — are
vendored from third-party repositories or have no recorded provenance, and none
carries a license or an attribution line. They ship once their upstream licenses
are checked and attribution is recorded, not before. Where the extracted skills
name one of them, they name it as a boundary — the question belongs elsewhere —
and do not answer it in its absence.

## Usage

Skills are referenced by their namespaced name:

```
engineering-paved-path:layered-architecture
engineering-paved-path:frontend-architecture
engineering-paved-path:skill-routing
```

An unqualified name resolves against whatever the host repository happens to have
installed. Use the full name.

## Inputs

Two of the three skills read nothing but what they are given. `skill-routing`
takes one input:

| Input | Default |
|---|---|
| `skillRouting` | The skill's own default map — deliberately small, matching only patterns that are unambiguous across repositories |

Resolved in this order, first hit wins: a value in the invocation →
`.claude/sdd-engineering.json` at the host repository root, under `skillRouting`
→ the default map. The configuration file is optional.

## What happens when something is missing

| Missing | Behavior |
|---|---|
| No `skillRouting` configuration | The default map applies. It covers only obvious frontend and backend paths; everything else is reported as **unmatched**. |
| A path that matches no rule | **No practice is assigned.** It is listed under `Unmatched`, never routed to the nearest-looking skill. |
| A rule naming a skill that is not installed | The skill is dropped from that row and reported with the rule that named it. No substitute is chosen. |
| A malformed `skillRouting` | Reported, and routing stops. The default map is not silently substituted for a map the repository got wrong. |
| No architecture documentation in the host repository | `layered-architecture` states the general rule; a ring-to-directory mapping inferred from naming is labelled **proposed** and does not become a blocking finding. |

## Writes

None. All three skills are guidance; they read and they answer.

## Dependencies

None, and that is an invariant rather than a coincidence. Every edge in this
marketplace points workflow → practice. A practice that reached back into a
workflow would close a cycle, and `scripts/graph.mjs` fails the build on one.

## Install

```bash
claude plugin install engineering-paved-path@dev-digest-ai-marketplace --scope project
```
