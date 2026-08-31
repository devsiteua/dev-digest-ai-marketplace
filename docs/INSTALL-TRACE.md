# Install trace — step 10

Proof that `sdd-engineering@1.0.0` and its dependencies install into a repository
that is not this one, resolve by tag, and behave the way the READMEs promise.

The point of this step is **attribution**. A workflow that runs in the
repository the components came from proves nothing: the same behavior could come
from files already on disk. So the target had to be a real project with its own
tests and **no copies of these agents or skills**, or a trace cannot show that
the plugin is what ran.

## The target

`devdigest-review-fixtures` — a small TypeScript service used for pull-request
review demonstrations.

| | |
|---|---|
| Source tree | `src/{api,auth,domain,files,http,jobs,notifications,orders,payments,reports,users}` |
| Tests | `tests/*.test.ts`, vitest |
| Scripts | `typecheck`, `test`, `check` — **npm, not pnpm** |
| Root instruction file | **none** — no `CLAUDE.md`, no `AGENTS.md` |
| Architecture documentation | **none** |
| Architecture check | **none** |
| `.claude/agents`, `.claude/skills` | **absent** — verified before installing |

The last row is what makes the trace evidence rather than a demonstration: there
is no local `architecture-reviewer` for the run to have picked up instead.

The absences are not a shortcoming of the target. They are the conditions the
extraction contract is written for, so this repository exercises the paths a
tidier one would not.

## Install

Installed from the marketplace by name, not with `--plugin-dir`. That is the
difference between testing a directory and testing a release.

```bash
claude plugin marketplace add devsiteua/dev-digest-ai-marketplace
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

```
✔ Successfully added marketplace: dev-digest-ai-marketplace
✔ Successfully installed plugin: sdd-engineering@dev-digest-ai-marketplace (scope: project)
  (+ 3 dependencies: engineering-paved-path, research-tools, architecture-review)
```

`claude plugin list`:

| Plugin | Version | Status |
|---|---|---|
| `sdd-engineering` | 1.0.0 | enabled |
| `engineering-paved-path` | `1.0.0-431f55ddd4b9` | enabled |
| `research-tools` | `1.0.0-431f55ddd4b9` | enabled |
| `architecture-review` | `1.0.0-431f55ddd4b9` | enabled |

Three things this settles:

1. **The dependency edges resolved.** One command installed four plugins; the
   consumer's three dependencies came along without being named.
2. **The tags resolved.** The resolved version carries `431f55ddd4b9` — the
   `main` commit all four `--v1.0.0` tags point at.
3. **None of the three documented failure modes occurred.**
   `claude plugin list --json` contains no `dependency-unsatisfied`, no
   `range-conflict` and no `no-matching-tag`. The diamond — `engineering-paved-path`
   reached directly and again through `architecture-review` — resolved to one
   installed copy.

## The trace

```
Session: 09a46d8a-a09f-4734-a8ef-2839119412f9 · 2 turns · $0.764
Prompt:  Use the architecture-review:architecture-reviewer agent to review
         src/orders and src/auth in this repository.
```

The report it returned is quoted below where it proves a contract. Emphasis added.

### It discovered, and refused to substitute

> **Guard:** not found — no architecture check script in `…/package.json`. Its
> `scripts` are `typecheck`, `test`, `check`; none is `arch:check`, `arch`,
> `architecture`, `lint:arch`, `depcruise`, `dep:check` or `boundaries`.
> **`npm run check` is a type/test gate and was deliberately not substituted for
> one.**

It enumerated the conventional names from
`architecture-review/references/host-configuration.md`, found the target's real
scripts, and declined the one that superficially fits. That is the single most
important rule in the extraction, demonstrated in a repository that has never
seen this plugin.

### It degraded honestly when the documentation was absent

> **Architecture docs:** none found — searched `docs/architecture.md`,
> `ARCHITECTURE.md`, `docs/ARCHITECTURE.md`, `docs/architecture/`, `docs/adr/`,
> `docs/decisions/`, `adr/`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`,
> `.claude/sdd-engineering.json` … Review is therefore against
> `engineering-paved-path:layered-architecture` alone, and the ring mapping below
> is **proposed** from directory naming, not agreed by the repository — **which is
> why nothing here is `CRITICAL`.**

Documented behavior, followed exactly: report the absence, fall back to the
general rule, label an inferred mapping as proposed, and cap the severity rather
than raise a blocking finding against a rule nobody wrote down.

### It applied the dependency's rule by namespaced reference

Every finding cites `engineering-paved-path:layered-architecture` by name and
quotes the section it applied — the ring table, "Where does this code go?",
forbidden import 7. The reviewer applies the rule and does not restate it, which
is the edge the dependency graph exists to create, working through an installed
plugin rather than a local file.

### It produced grounded findings in unfamiliar code

Five findings, each on a real `file:line` in the target:

| # | Severity | What it found |
|---|---|---|
| 1 | WARNING | `admin-router.ts:39` re-decides order visibility inline instead of using the chokepoint at `order-access.ts:4`, so "not found" and "not permitted" become indistinguishable |
| 2 | WARNING | Three delivery-ring files import `order-store.ts` directly, reaching past the application layer into persistence |
| 3 | WARNING | `order-digest.ts` fabricates an admin principal and runs the policy against it — a check that reads as an authorization boundary while enforcing nothing |
| 4 | WARNING | No composition root: `index.ts` is fourteen `export *` lines, and importing the barrel schedules a cron job as a side effect |
| 5 | SUGGESTION | `src/orders` imports `src/auth` directly — held at SUGGESTION because the imported code is pure policy, which the rule's own escape clause allows |

Finding 4 naming itself as the structural cause of 1–3, and finding 5 being
argued *down* because the rule permits it, are both behaviors the prompt asks
for and neither is reachable by pattern matching.

## What this step does not prove

- **Only one component was exercised.** `architecture-review:architecture-reviewer`
  ran end to end; the four `sdd-engineering` agents and the three skills were
  installed and enabled but not invoked here. The behaviour suite in
  `plugins/*/evals/` covers those, against fixtures rather than this repository.
- **The target has no architecture documentation**, so the branch where the
  repository's own rules outrank the skill was not exercised — only the branch
  where they are absent.
- **Nothing was changed in the target.** The review is read-only by grant, and
  no plan was run against it.

## Reproducing it

```bash
cd <a repository that is not this one and has no local copies of these components>
claude plugin marketplace add devsiteua/dev-digest-ai-marketplace
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
claude plugin list
claude -p "Use the architecture-review:architecture-reviewer agent to review <paths>. \
  Pass through its full report verbatim as your entire reply." --output-format json
```

The `--output-format json` wrapper is what makes it a trace rather than a
screenshot: it carries the session id, the turn count and the cost alongside the
report.
