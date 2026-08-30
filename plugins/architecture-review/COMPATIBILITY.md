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
| Architecture documentation | No. Its absence is reported and the review continues against the general rule. |
| An architecture check script | No. Its absence is reported as `not found`. |
| A package manifest | No. With none, the check is reported as not found. |
| A specific package manager | No. `pnpm`, `yarn`, `bun` and `npm` are discovered; `npm` is the fallback. |
| A specific ecosystem or layout | No. Layer, package and module names come from the repository's own documentation. |
| Version control | Recommended. A diff scope needs it; a path-list scope does not. |

## Network

None. The agent has no `WebSearch` or `WebFetch`, sends no repository content
anywhere, and does everything in the session you already started.
