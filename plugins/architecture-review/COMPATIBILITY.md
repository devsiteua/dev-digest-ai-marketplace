# Compatibility

## Claude Code

**Minimum: 2.1.110.**

This plugin declares a version-constrained dependency on
`engineering-paved-path@^1.0.0`, which is the capability that sets the floor for
this marketplace. Nothing else in the plugin needs a newer version: one agent
file and one plugin-level reference read through `${CLAUDE_PLUGIN_ROOT}`.

## Dependencies

`engineering-paved-path@^1.0.0` must be installed. The agent loads
`engineering-paved-path:layered-architecture` before judging, and
`engineering-paved-path:frontend-architecture` when the scope includes UI code.
Without them it has no general rule and can only apply what the host repository
has written down.

## Host repository

| Expectation | Required? |
|---|---|
| Architecture documentation | No. Its absence is reported and the review continues against the general rule. |
| An architecture check script | No. Its absence is reported as `not found`. |
| A package manifest | No. With none, the check is reported as not found. |
| A specific package manager | No. `pnpm`, `yarn`, `bun` and `npm` are discovered; `npm` is the fallback. |
| A specific ecosystem or layout | No. Layer, package and module names come from the repository's own documentation. |
| Version control | Recommended. A diff scope needs it; a path-list scope does not. |

## Network

None. The agent has no `WebSearch` or `WebFetch`, sends no repository content
anywhere, and does everything in the session you already started.
