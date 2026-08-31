---
name: read-only-report
fixture: no-manifest
files_unchanged: true
expect:
  - contains: "## Conclusion"
  - contains: "## Evidence"
  - contains: "## Not found"
  - matches: "pricing\\.js"
  # The documented cost of dropping Bash: history is out of reach, and the agent
  # says so instead of inventing a commit.
  - matches: "(git log|git blame|cannot run|version-control history|history)"
  # A repository with no package.json is a normal repository, not an error.
  - not_matches: "(cannot proceed|unable to continue|no package\\.json.*error)"
---
Use the research-tools:researcher agent for this repository-scoped question:
"How is an order's price computed here, and what does that computation depend on?"
I will use the answer to decide a refactor.

Pass through the agent's full report verbatim as your entire reply.
