---
name: missing-guard
fixture: no-manifest
plugins:
  - architecture-review
  - engineering-paved-path
files_unchanged: true
expect:
  # An absent optional command is a documented state, reported and continued past.
  - matches: "(guard|architecture check)[^\\n]*not found"
  # The review still happened, against the repository's own written rules.
  - contains: "ARCHITECTURE.md"
  - matches: "pricing\\.js"
  - contains: "Not checked"
  # Never substitute a similar-looking script, and never invent a command.
  - not_matches: "(npm run lint|pnpm arch:check|npm test)"
---
Use the architecture-review:architecture-reviewer agent to review src/ in this
repository.

Pass through its full report verbatim as your entire reply.
