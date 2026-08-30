# sdd-engineering

The spec-driven development workflow: write a specification, plan the
implementation against it, run the plan, and verify the result through an
independent review gate.

**Status: scaffold.** Agents, skills and evals are extracted in a follow-up
pull request.

## Contents

| Reference | Kind |
|---|---|
| `sdd-engineering:spec-creator` | agent |
| `sdd-engineering:implementation-planner` | agent |
| `sdd-engineering:implementer` | agent |
| `sdd-engineering:plan-verifier` | agent |
| `sdd-engineering:run-plan` | skill |
| `sdd-engineering:workflow-retro` | skill |
| `sdd-engineering:engineering-insights` | skill |

## Dependencies

```
sdd-engineering
├── engineering-paved-path@^1.0.0    shared technical skills
├── research-tools@^1.0.0            delegated read-only discovery
└── architecture-review@^1.0.0       independent review gate
    └── engineering-paved-path@^1.0.0
```

Dependencies are installed automatically by the plugin installer.

## Install

```bash
claude plugin marketplace add devsiteua/dev-digest-ai-marketplace --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

Start a new session or run `/reload-plugins`, then verify:

```bash
claude plugin list --json
```
