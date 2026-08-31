# Compatibility

## Claude Code

**Minimum: 2.1.110.**

The floor for this marketplace, set by its use of version-constrained plugin
dependencies. This plugin declares none of its own and uses nothing newer: three
skills, each a `SKILL.md` with frontmatter plus reference files read by relative
path from the skill directory.

## Dependencies

None. This is a leaf plugin and stays one — every edge in this marketplace points
workflow → practice, never the reverse.

## Host repository

| Expectation | Required? |
|---|---|
| `.claude/sdd-engineering.json` | No. `skill-routing` falls back to its default map; the other two skills read no configuration. |
| Architecture documentation | No. `layered-architecture` states the general rule and labels any inferred ring mapping as proposed. |
| A specific ecosystem or language | No. `layered-architecture` states directions rather than package names, and `references/enforcement.md` covers guards for TypeScript, Python, Java/Kotlin, Go, .NET and Rust. |
| React or Next.js | Only for `frontend-architecture`, whose rules 10 and 13 are App Router specifics. Rules 1–9, 11 and 12 apply to any component-based UI. |

## Network

None. All three skills are text; nothing fetches anything.
