# Component inventory

Every component in the source repository's `.claude/` directory, sorted into what
gets extracted and what stays behind. This is the record behind the plugin
boundaries in [PLUGIN-GUIDELINES.md](PLUGIN-GUIDELINES.md); it is written once
and revisited when a component moves.

Source: `.claude/` of the DevDigest product repository — 9 agents, 17 skills,
`settings.json`, `settings.local.json`, `.mcp.json`, `skills-lock.json`.

## Method

A component is portable only if all four answers hold:

1. **Owner** — who reviews a change to it after extraction?
2. **Consumer scenario** — which workflow, in a repository that is not DevDigest,
   breaks without it?
3. **Release coupling** — why does it ship on the same version as the rest of its
   plugin?
4. **Cost of removal** — what has to change for it to stop knowing about
   DevDigest?

Question 4 is the one that decides. A component that answers 1–3 well but needs
its whole body rewritten is not an extraction, it is a new component with a
familiar name.

## Group 1 — Portable

### Agents

| Component | Plugin | Consumer scenario | DevDigest refs | Extraction work |
|---|---|---|---|---|
| `researcher` | `research-tools` | Any repository needs a read-only answer — how something works, where it lives, what depends on it — without a change | **0** | None. Copy as is. The only component in the source tree that is already generic. |
| `spec-creator` | `sdd-engineering` | A feature starts; requirements must exist before a plan | 4 | Drop the four `mcp__devdigest__*` tools (see Group 3). Make the `specs/` output path an input. Replace `pnpm` with a discovered test command. |
| `implementation-planner` | `sdd-engineering` | An approved spec must become an ordered, verifiable plan | 21 | Make `specs/plans/<slug>.md` an input with a documented default. Replace the `server/` · `client/` · `reviewer-core/` routing table with a repository-supplied one — **see the blocker below**. |
| `implementer` | `sdd-engineering` | A plan must be executed step by step under the right practices | 26 | Replace `pnpm typecheck` / `pnpm test` / `pnpm arch:check` with discovered commands, and document the behavior when none is found: report and stop, never guess. |
| `plan-verifier` | `sdd-engineering` | Finished code must be checked against the spec, criterion by criterion | 12 | Same path and command inputs. The `AC → task → test → commit` matrix itself is repository-agnostic already. |
| `architecture-reviewer` | `architecture-review` | A change needs an independent architectural verdict | 27 | The heaviest of the agents. Every hardcoded `reviewer-core/`, `server/`, `client/`, `@devdigest/shared` check becomes "read the repository's own architecture documentation". Behavior when that documentation is absent must be documented. |

**Owner:** the AI Engineering team, for all six.

**Release coupling:** the four SDD agents share one contract — the spec format,
the `AC-NN` numbering, the plan shape, the verification matrix. Change the spec
format and all four move together, which is exactly what a shared version means.
`researcher` and `architecture-reviewer` are separately versioned because both
have consumers who never run the SDD workflow.

### Skills

| Component | Plugin | Consumer scenario | DevDigest refs | Extraction work |
|---|---|---|---|---|
| `implement` → `run-plan` | `sdd-engineering` | Runs the plan end to end: implementer, review gate, fix iterations, verifier | 19 | Rename to `run-plan`. Replace `pnpm arch:check` with the discovered command. Reference the review gate as `architecture-review:architecture-reviewer`. |
| `workflow-retro` | `sdd-engineering` | After a multi-agent run, report what it cost and what to change | 3 | Only `docs/retro/ledger.md` is DevDigest-shaped — make the ledger path an input. Cheapest extraction of the three skills. |
| `engineering-insights` | `sdd-engineering` | Load what earlier sessions learned about a package; record what this one learned | 6 | Generalize away the `server/` · `client/` · `reviewer-core/` package list. Must discover packages rather than know them — this is the "generalized" qualifier in the plugin's contents list. |
| `onion-architecture` → `layered-architecture` | `engineering-paved-path` | Deciding where backend code belongs; judging a layering violation | **44** | The most DevDigest-bound file in the source tree. The dependency *rule* is general; every example, package name and `pnpm arch:check` invocation is not. Effectively a rewrite that keeps the rule and replaces the evidence. |
| `frontend-architecture` | `engineering-paved-path` | Deciding where a component, hook or route belongs | 25 | Same shape, smaller. The placement rules are general; the folder examples are DevDigest's. |
| `skill-routing` (new) | `engineering-paved-path` | Mapping a changed path to the practices that apply to it | — | Extracted from §3 of `pr-self-review`. See the blocker below. |

## The routing-table blocker

`implementation-planner` step 8 assigns the skills the implementer will apply,
and it does so by reading a table it does not own:

> The canonical path → skills table is **§3 "Route by path *and* by status" of
> `.claude/skills/pr-self-review/SKILL.md`**. Read it and use it; do not restate
> it here and do not invent a second one.

`pr-self-review` is **not** being extracted — it is a pre-pull-request gate built
around DevDigest's packages and its `gh pr create` hook, and it carries 26
DevDigest references. So the planner's most repository-specific step depends on a
skill that stays behind.

Measured, not assumed: no extracted SDD component names any technical skill
directly. Every one of the seventeen skill names was grepped against all six SDD
agents and the `implement` skill — zero matches. The coupling between the SDD
workflow and the technical skills runs *entirely* through this one table.

That is good news for the plugin boundary and it settles the scope question:
`engineering-paved-path@1.0.0` does not need eleven skills, because the workflow
never asks for them by name. It needs a routing mechanism.

Resolution, to be built in step 4: extract §3 into a standalone
`engineering-paved-path:skill-routing` skill that takes the path → practice
mapping as a repository-supplied input, with a documented default and a
documented behavior when a host repository supplies nothing. The planner reads
the mapping; it never carries one.

## Recommended `engineering-paved-path@1.0.0`

Three skills, not eleven:

| Skill | Why it ships in 1.0.0 |
|---|---|
| `layered-architecture` | `architecture-review` cannot do its job without a statement of the dependency rule |
| `frontend-architecture` | The planner needs placement rules to assign a step a location |
| `skill-routing` | Resolves the blocker above; the planner's step 8 has no other source |

Everything else is deferred, for two independent reasons.

**Discovery cost.** The lab is explicit that a large "just in case" list inflates
discovery context for everyone who installs a plugin that depends on this one.
Eight skill descriptions load on every session of every consumer; three do not.

**Provenance.** Six of the technical skills are vendored from third-party GitHub
repositories by content hash, recorded in `skills-lock.json`:

| Skill | Upstream |
|---|---|
| `drizzle-orm-patterns` | `giuseppe-trisciuoglio/developer-kit` |
| `fastify-best-practices` | `mcollina/skills` |
| `next-best-practices` | `vercel-labs/next-skills` |
| `postgresql-table-design` | `wshobson/agents` |
| `typescript-expert` | `sickn33/antigravity-awesome-skills` (frontmatter: `source: community`) |
| `zod` | `pproenca/dot-skills` |

A further four — `mermaid-diagram`, `react-best-practices`, `react-testing-library`,
`security` — are in neither `skills-lock.json` nor the hand-authored list in the
source repository's `CLAUDE.md`. Their provenance is unrecorded.

Not one of the ten carries a LICENSE file or an attribution line. Vendoring
third-party content into a private repository and **republishing it from a public
MIT-licensed marketplace** are different acts with different obligations. That is
a licensing question, not an engineering one, and it is not ours to answer by
merging. Each skill needs its upstream license checked and its attribution
recorded before it ships; the ones that clear go into `1.1.0`.

## Group 2 — Project-specific

Stays in DevDigest. Each of these is useful precisely because it knows things
about DevDigest, and knowing them is what makes it unportable.

| Component | Why it stays |
|---|---|
| `pr-self-review` (skill) | A pre-pull-request gate wired to DevDigest's package layout, its severity normalisation and its `gh pr create` hook. §3 is extracted; the skill is not. |
| `design-reference` (skill) | Looks up the DevDigest product design at `reference/devdigest-design/` and maps it onto `@devdigest/ui`. Every sentence names a DevDigest screen. |
| `security-reviewer` (agent) | Traces attacker-controlled input through `server/`, `reviewer-core/` and `client/`. A generalized security reviewer is a worthwhile plugin; it is not this file with the names removed. |
| `test-writer` (agent) | 28 references. Encodes DevDigest's three test lanes — vitest + jsdom in `client/`, the unit and `*.it.test.ts` lanes in `server/`, the pure engine in `reviewer-core/`. Portable only as a rewrite. |
| `doc-writer` (agent) | Writes into DevDigest's `docs/`, and is explicitly forbidden from touching `docs/agent-prompts/*.md` because those five files are byte-mirrors of product code. That rule is meaningless anywhere else. |
| `.claude/agents/README.md`, `.claude/skills/README.md` | Indexes of the above, for this repository. |
| `CLAUDE.md`, `INSIGHTS.md`, `specs/`, `docs/` | Product instructions, accumulated learnings, product specs. Never plugin content. |

`test-writer`, `security-reviewer` and `doc-writer` are the obvious candidates
for a second wave — `testing-tools`, `security-review`, `docs-tools` — once
`sdd-engineering` has proven the extraction pattern. They are not in scope for
1.0.0 and no plugin declares them.

## Group 3 — Optional integrations

Anything with network access, credentials or a running service. None of it is a
dependency of a core workflow plugin.

| Component | What it is | Disposition |
|---|---|---|
| `.mcp.json` — the `devdigest` MCP server | stdio server started with `pnpm --dir mcp exec tsx src/index.ts`, talking to `DEVDIGEST_API_URL=http://localhost:3001` | Not extracted. It requires the DevDigest API to be running. |
| `mcp__devdigest__list_agents`, `get_conventions`, `get_findings`, `get_blast_radius` | Four MCP tools in `spec-creator`'s tool grant | **Removed during extraction.** An installed `spec-creator` that lists tools from a server the host repository has never heard of is a broken plugin, not an optional one. The interrogation flow does not need them. |
| `researcher`'s `WebSearch` / `WebFetch` | Network access for external research | **Kept**, and documented in the plugin README as network-using. It is the agent's stated purpose, needs no credentials, and reaches nothing private. |
| `enabledPlugins: { "github@claude-plugins-official" }` | A third-party plugin enabled in `settings.json` | Host repository's choice. A plugin does not enable other plugins for its users. |

Should the DevDigest MCP tools ever be worth publishing, they belong in a
`devdigest-integrations` plugin that nothing in `sdd-engineering` depends on.

## Group 4 — Local residue

Never leaves the machine.

| Component | What it is |
|---|---|
| `.claude/settings.local.json` | ~30 personal `Bash(...)` permission entries — `pnpm arch:check`, `curl localhost:3001/agents`, specific `node -e` one-liners. One author's session history. |
| `.claude/pr-self-review/last-verdict.json` | Cached verdict keyed to a diff hash. Cache. |
| `.claude/settings.json` hooks | `$CLAUDE_PROJECT_DIR/scripts/pr-self-review-gate.sh` and `readonly-agent-guard.sh` — point at scripts in the DevDigest repository root. |
| `skills-lock.json` | Vendoring ledger for the source repository. Evidence for the provenance question above, not a shipped artifact. |
| `reference/`, `.idea/`, `docker-compose.yml` | Local reference material, IDE settings, local infrastructure. |

**`readonly-agent-guard.sh` deserves a note.** It enforces at the harness level
what `researcher`'s tool grant claims at the prompt level. The script itself is
project-local, but the guarantee it provides is not — a read-only agent whose
read-onlyness is only asserted in its own prompt is weaker after extraction than
it was before. `research-tools` must make the restriction real through its tool
grant, which is why [SECURITY.md](SECURITY.md) treats a tool grant as a security
boundary rather than a hint.

## Two more findings worth recording

**The eval harness exists; it is just in another worktree.** The `evals/` package
is not on the branch the components were read from — it lives in the lesson-06
worktree, already merged there. It is not DevDigest product code: it is a
self-contained vitest + Agent SDK harness for a Claude Code setup, and its own
README says it "only adds the `evals/` folder and never touches `server/` or
`client/`".

Its entire coupling to DevDigest is one file, `evals/src/artifacts/paths.ts`, and
two constants:

```ts
export const SKILLS_DIR = join(REPO_ROOT, ".claude", "skills");
export const AGENTS_DIR = join(REPO_ROOT, ".claude", "agents");
```

Pointing those at `plugins/*/skills` and `plugins/*/agents` is a few lines. The
cases themselves are written here, against the extracted components rather than
copied from DevDigest — but nothing about this waits on another workstream.

**`workflow-retro` has no `scripts/` directory.** The lab's acceptance list checks
that `workflow-retro/scripts/analyze_journals.py` uses `${CLAUDE_SKILL_DIR}`. The
source skill is a single 145-line `SKILL.md` with no script at all. Either the
script is written during extraction — in which case `${CLAUDE_SKILL_DIR}` applies
from its first line — or the criterion is satisfied vacuously and we say so
rather than inventing a file to satisfy a checklist.

## Totals

| Group | Agents | Skills | Other |
|---|---|---|---|
| Portable | 6 | 5 + 1 new | — |
| Project-specific | 3 | 2 | 2 READMEs, `CLAUDE.md`, `INSIGHTS.md`, `specs/`, `docs/` |
| Optional integrations | — | — | `.mcp.json`, 4 MCP tools, 1 enabled plugin |
| Local residue | — | — | `settings.local.json`, hooks, cache, `skills-lock.json` |

Six skills stay out of `engineering-paved-path@1.0.0` pending a license check,
and four more pending a provenance answer.
