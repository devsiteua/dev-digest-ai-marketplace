# architecture-review

An independent architectural review gate. The `architecture-reviewer` agent
judges code that already exists against the architecture documentation of the
repository it runs in, and against the dependency rule stated in
`engineering-paved-path:layered-architecture` — never against module names baked
into the agent.

It is deliberately a separate plugin from the workflow that calls it. A verdict
from the agent that wrote the code is not a review.

## Contents

| Reference | Kind |
|---|---|
| `architecture-review:architecture-reviewer` | agent |

## Usage

```
architecture-review:architecture-reviewer
```

Give it a scope that resolves to a file list — a diff, a branch, a commit range,
a path list or a package. "Look at the architecture" is not a scope, and the
agent says so rather than reviewing the whole repository.

It returns a verdict, a findings table where every row cites a `file:line` and
names the written rule it breaks, the pre-existing debt it saw, the axes it
checked and found clean, and the axes it did **not** check with the reason.

## Inputs

Resolved in this order, first hit wins: a value in the invocation →
`.claude/sdd-engineering.json` at the host repository root → the documented
default. The configuration file is optional; a repository that accepts the
defaults needs no configuration step.

| Input | Default |
|---|---|
| `architectureDocs` | Discovered: `docs/architecture.md`, `ARCHITECTURE.md`, `docs/architecture/`, ADR directories, then the architecture sections of the root instruction file |
| `commands.archCheck` | Discovered from the host manifest by conventional script name, run through the host's own package runner |

The full contract — every discovery order, and what happens when nothing is
found — is [`references/host-configuration.md`](references/host-configuration.md).

## What happens when something is missing

Nothing is guessed. Each absence has one documented behavior:

| Missing | Behavior |
|---|---|
| No architecture check script | Reported as `Guard: not found`, the review continues. An absent optional command is a state, not a failure. A lint script is never substituted for it. |
| The check exists but cannot run | A finding at `WARNING`. A configured, broken guard is not the same as no guard. |
| No architecture documentation | Reported in the header. The review runs against the general dependency rule alone, and every axis needing a repository-specific rule is listed under **Not checked**. The agent does not infer the rule from the code it is reviewing. |
| A configured path that does not exist | Reported as a finding. |

## Tool grant

```
Read, Grep, Glob, Bash, Skill, TodoWrite
```

Unchanged from the source. `Bash` is needed to run the discovered architecture
check and to read history; `Write` and `Edit` are absent, and the agent proposes
no patch.

Be aware of what enforces that. In its original repository a `PreToolUse` hook
rejected mutating commands from this agent by name. **A plugin does not install
hooks into a host repository's settings**, so that guard did not travel. What
remains is the absent `Write`/`Edit` grant plus the agent's own rules. If your
repository wants a harness-level guard, it configures its own.

## Writes

None. The agent's only output is its report, returned to the caller.

## Dependencies

- `engineering-paved-path@^1.0.0` — `layered-architecture` states the dependency
  rule the reviewer applies, and `frontend-architecture` the component placement
  rules. The reviewer applies them and does not restate them; without this
  plugin it would have no general rule to fall back on when a repository
  documents none.

## Install

```bash
claude plugin install architecture-review@dev-digest-ai-marketplace --scope project
```
