---
name: skill-routing
description: "Maps a list of changed or planned file paths to the practice skills that apply to each one, using the host repository's own path → practice map when it has one and a deliberately small default when it does not. Returns a routing table plus an explicit list of paths that matched nothing — an unrecognised path is assigned no practice rather than the nearest-looking one. Use when a plan step, a review or a change needs to know which practices govern it. Trigger terms: which skill applies, route by path, path to skill, which practices, assign a practice, routing table, what governs this file."
allowed-tools: Read, Glob
---

# Skill routing

Answers one question: **given these paths, which practices apply?**

It does not compute the diff, does not review anything and does not load the practices it
names. It is given a path list and returns a routing table the caller acts on. That
separation is deliberate — it means a caller with no `Bash` grant can still route.

## The one rule that matters

**An unrecognised path maps to no practice.** Not to the closest match, not to a general
skill "just in case", not to the practice that governs the neighbouring directory. It goes
into the `Unmatched` list, and the caller says so.

A router that always returns something is worse than useless: the caller cannot tell a real
match from a shrug, and a plan step gets assigned a practice that does not govern it. The
`Unmatched` list is the honest output, and it is never omitted because it is long.

## Inputs

| Input | Given by | Default |
|---|---|---|
| `paths` | the caller — a list of paths, each optionally with a version-control status | required |
| `skillRouting` | the host repository | the default map below |

`skillRouting` is resolved in this order, first hit wins:

1. A value given in the invocation.
2. `.claude/sdd-engineering.json` at the host repository root, under the `skillRouting` key.
3. The default map below.

```jsonc
// .claude/sdd-engineering.json
{
  "skillRouting": {
    "inheritDefaults": false,
    "rules": [
      { "match": "src/api/**", "lane": "BACKEND",  "skills": ["engineering-paved-path:layered-architecture"] },
      { "match": "src/ui/**",   "lane": "FRONTEND", "skills": ["engineering-paved-path:frontend-architecture"],
        "placementOnly": ["engineering-paved-path:frontend-architecture"] },
      { "match": "db/schema/**", "lane": "DATA", "skills": ["acme-practices:sql-schema"] }
    ]
  }
}
```

| Field | Meaning |
|---|---|
| `match` | A glob against the repository-relative path. Rules are tried in order; the **first** match wins, so put the specific rule above the general one. |
| `lane` | A label for grouping. Free text; it exists so a caller can batch work by lane instead of by file. |
| `skills` | Namespaced references, always `<plugin>:<skill>`. An unqualified name resolves against whatever the host happens to have installed, which is exactly the ambiguity this map removes. |
| `placementOnly` | The subset of `skills` that answers *where code goes*. Applied only to added and renamed files — see the status rule. |
| `inheritDefaults` | `false` (the default): the host map is the whole map. `true`: paths matching no host rule fall through to the default map below. |

A host map with an empty `rules` array is a valid statement — "no practice applies to
anything here" — and is honoured. It is not treated as a missing map.

**A malformed `skillRouting`** — not an array, a rule with no `match`, an unqualified skill
name — is reported and the routing stops. Do not fall back to the default map silently: a
repository that wrote a map and got it wrong needs to know, and quietly ignoring it hands
back a routing nobody chose.

## Route by path *and* by status

When the caller supplies a version-control status per path, it is relative to the
merge-base, so a file first created on this branch reads `A` even while it is being edited.

| Status | What applies |
|---|---|
| `A` (added), `R` (renamed) | every skill in the rule, `placementOnly` included |
| `M` (modified) | the rule's skills **minus** `placementOnly` — do not argue about where a file lives when it merely changed |
| `D` (deleted) | nothing. A deleted file has no practice; report it so its consumers get looked at |
| none supplied | treat as `A` and say so in the report — routing without status over-applies placement skills rather than under-applying them |

## The default map

Small on purpose. It contains only what this plugin actually publishes, and it matches only
patterns that are unambiguous across repositories.

| Match | Lane | Skills | Placement-only |
|---|---|---|---|
| `**/*.{tsx,jsx}` | FRONTEND | `engineering-paved-path:frontend-architecture` | `engineering-paved-path:frontend-architecture` |
| `**/{components,app,pages,routes,views,ui}/**/*.{ts,js,tsx,jsx,vue,svelte}` | FRONTEND | `engineering-paved-path:frontend-architecture` | `engineering-paved-path:frontend-architecture` |
| `**/{server,api,backend,services,domain}/**/*.{ts,js,py,go,rb,java,kt,cs,rs}` | BACKEND | `engineering-paved-path:layered-architecture` | — |
| everything else | — | none | — |

That last row is the point. Configuration, documentation, tests, infrastructure, schemas,
build files and every directory named something this table has never heard of get **no
practice**, and the caller is told which paths those were.

If that feels too thin: it is. The default is a floor for a repository that has said nothing
about itself, not a guess at what it contains. A repository that wants real routing writes
`skillRouting`, and the report below is written to make that need obvious.

## Check that a skill is actually there

Before returning a skill in the table, confirm it is available in this session. A rule may
name a practice from a plugin the host has not installed, or one that was renamed.

A named skill that is not present is **dropped from the row and reported**, with the rule
that named it. Its lane degrades to whatever else the rule listed, or to unmatched. Never
substitute a different skill for a missing one.

## Output

Return this whole, and return it **before** any work that depends on it, so a person can
disagree with the routing while it is still cheap.

```markdown
## Routing

**Map:** host (`.claude/sdd-engineering.json`) | default | host + defaults
**Paths in:** <n> · **Routed:** <n> · **Unmatched:** <n>

| Lane | Paths | Practices |
|---|---|---|
| BACKEND | `a/b.ts` (M), `a/c.ts` (A) | `engineering-paved-path:layered-architecture` |

## Unmatched — no practice applies
| Path | Status | Why |
|---|---|---|
| `infra/deploy.yaml` | M | no rule matched |
| `src/legacy/thing.ts` | M | matched rule `src/legacy/**`, which lists no skills |

## Notes
- <a named skill that was not installed, and the rule that named it>
- <a status that was missing and defaulted to `A`>
```

`Unmatched` stays in the output even when empty — an empty list is a claim that every path
was recognised, and it should be made deliberately.

## What this skill will not do

- **Guess.** Covered above; it is the whole design.
- **Load the practices.** The caller loads what the table names, when it needs them. Loading
  five skills to route a diff is how a routing step ends up costing more than the work.
- **Rank or deduplicate practices by preference.** If two rules could match, the first one
  wins and that is the answer. Ordering is the host's decision, expressed by rule order.
- **Read the repository to infer a map.** Code shows what a repository does, never what it
  intended. The map is configuration or it is the default.
