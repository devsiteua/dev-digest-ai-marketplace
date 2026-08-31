---
name: no-test-command
fixture: no-test-script
plugins:
  - sdd-engineering
  - engineering-paved-path
  - research-tools
  - architecture-review
timeout_seconds: 900
expect:
  # The absence is named, and where it was looked for is named with it.
  - matches: "package\\.json"
  - matches: "(typecheck|type-check|type check)[^\\n]*not found"
  - matches: "(no test|not found|declares no test|none declared)"
  # THE rule. `lint` and `start` are the only scripts this repository has;
  # neither can pass or fail on the spec's criteria, so neither may occupy a
  # Verify line. A command an earlier step *creates* is allowed there — that
  # closes the gap rather than papering over it — so this forbids the
  # substitution without forbidding the fix.
  - not_matches: "Verify:[^\\n]*(eslint|run lint|npm start)"
---
Use the sdd-engineering:implementation-planner agent to plan the spec at
specs/rounding.md in this repository.

When it is done, print the plan file's `## Implementation plan` section verbatim,
every step, followed by its `## Commands in this repository` section. Print
nothing else.
