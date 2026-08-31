---
name: routing-unmatched
negative: true
fixture: no-test-script
files_unchanged: true
expect:
  # An unrecognised path is reported, never routed to the nearest-looking skill.
  - matches: "(unmatched|no practice|matched nothing|no rule matched)"
  - matches: "(infra/terraform/main\\.tf|main\\.tf)"
  # The whole failure this skill exists to prevent.
  - not_matches: "(main\\.tf[^\\n]*(layered-architecture|frontend-architecture))"
---
Use the engineering-paved-path:skill-routing skill to route these three paths,
all newly added, and show me the routing table it produces:

- src/components/Cart.tsx
- infra/terraform/main.tf
- docs/adr/0004-queueing.md
