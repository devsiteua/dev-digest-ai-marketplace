---
name: no-scope-refuses
negative: true
fixture: no-manifest
plugins:
  - architecture-review
  - engineering-paved-path
files_unchanged: true
expect:
  # "Look at the architecture" is not a scope. The agent must refuse cheaply
  # rather than reviewing the whole repository.
  - matches: "(cannot start|missing:|need a scope|no scope)"
  - not_matches: "## Findings"
---
Use the architecture-review:architecture-reviewer agent. Tell it only this, and
give it nothing else: "Look at the architecture."

Pass through its reply verbatim as your entire reply.
