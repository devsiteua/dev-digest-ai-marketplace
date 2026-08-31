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
  # 1.1.0: paths in the report are repository-relative. Matched by shape — a
  # space then a slash then a word, on the header lines — rather than by naming
  # a home directory, because the literal would trip the absolute-path grep that
  # CI runs over plugins/.
  - not_matches: "Scope:[^\\n]* /[A-Za-z]"
  - not_matches: "Guard:[^\\n]* /[A-Za-z]"
---
Use the architecture-review:architecture-reviewer agent to review src/ in this
repository.

Pass through its full report verbatim as your entire reply.
