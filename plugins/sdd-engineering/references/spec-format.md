# The spec and plan format

What a specification is, what a plan is, why they are two files, and the shape
every acceptance criterion takes. `spec-creator`, `implementation-planner` and
`plan-verifier` all read this file; it is the format they share.

**A host repository may override it.** If `<specDir>/README.md` or
`<specDir>/TEMPLATE.md` exists in the repository, that is the format, and this
file is not consulted. A repository that already has a spec convention keeps it;
one that does not gets this.

## What a spec is

A spec answers **"what should exist when this is done"**. It is deliberately
short-lived: once the work ships, the spec is marked `done`.

Not to be confused with:

- `README.md` — what a package is and how to run it (permanent, human-facing)
- `docs/` — how something works and *why* it was decided that way (permanent)
- an accumulated-insights file — what we learned the hard way (append-only)

## Rules

1. **One file per feature**, named `kebab-case.md` under `specDir`. The `Spec ID`
   in the header is that slug, upper-cased. A spec that replaces an earlier one
   names it in `Supersedes:`; a `done` spec is never rewritten.
2. **Copy the template.** Every section stays, even if the honest answer is
   "none". A deleted section reads as an oversight; the word "none" is a claim
   someone can disagree with.
3. **`Out of scope` is the most valuable section.** It is what stops an agent
   redesigning half the codebase on the way to a small feature.
4. **Acceptance criteria must be checkable** by a human or a test — not
   aspirations. Every criterion carries an **`AC-NN`** id, numbered from `AC-01`
   in one flat sequence across the whole file, and exactly one of the five EARS
   patterns below. The id is the thing that survives: the plan tags each step
   `Covers: AC-NN`, and `plan-verifier` returns a row per id. **Ids are never
   renumbered once a plan cites them** — a dropped criterion leaves its number
   behind, struck through.
5. **Status transitions:** `draft` → `in-progress` → `done` | `dropped`. Never
   delete a spec; history explains why the code looks the way it does. **A spec
   stays `draft` while a single `[NEEDS CLARIFICATION: …]` marker remains
   anywhere in it** — that marker is how an agent records an unanswered question
   instead of guessing, and an unanswered question is not an approved
   requirement. Where other write-ups say `approved`, read `in-progress`; where
   they say `implemented`, read `done`.
6. **When a spec closes**, remove its pointer from wherever the repository links
   to open work.

## Where plans live

A spec says *what*; a plan says *how*. They are two files, never one:

| Artefact | Path | Written by |
|---|---|---|
| spec | `<specDir>/<slug>.md` | `sdd-engineering:spec-creator` |
| implementation plan | `<planDir>/<slug>.md` | `sdd-engineering:implementation-planner` |

Defaults are `specs/` and `specs/plans/`; both are inputs — see
[host-configuration.md](host-configuration.md). For work scoped to a single
package of a multi-package repository, the pair may sit at
`<package>/specs/<slug>.md` and `<package>/specs/plans/<slug>.md`. The plan always
keeps its spec's slug, always sits in a `plans/` directory beside its spec, and
always links back to it in its header.

It carries four sections a spec does not: `Constraints in force`,
`Implementation plan`, `Commit plan` and `Handoff`.

**The separation is a rule, not a preference.** `implementation-planner` may never
write or edit a spec — a gap in the requirements goes back to `spec-creator` — so
a plan living inside its spec file would make planning impossible without breaking
that rule.

## EARS — the shape every acceptance criterion takes

**EARS** — *Easy Approach to Requirements Syntax* — is a way of phrasing a
requirement that separates the condition from the system's response. Alistair
Mavin, Philip Wilkinson, Adrian Harwood and Mark Novak, then at Rolls-Royce,
presented it at the 17th IEEE International Requirements Engineering Conference
(RE'09) in 2009.

Five patterns. `shall` is the marker of an obligation.

| Pattern | When to use it | Example |
|---|---|---|
| **Ubiquitous** | the requirement always holds | The system shall log every authentication attempt. |
| **Event-driven** | a response to something that happens | WHEN a user submits the sign-in form, the system shall validate the credentials. |
| **State-driven** | behaviour that holds while a state lasts | WHILE a synchronisation is running, the system shall display its progress. |
| **Unwanted behaviour** | a response to an undesirable condition | IF validation fails three times within 60 seconds, THEN the system shall temporarily lock the account. |
| **Optional feature** | behaviour that exists only behind an enabled option | WHERE MFA is enabled, the system shall require a TOTP code after the password. |

What the patterns are for, in one line: a criterion that names its trigger can be
failed by a test, and one that does not can only be argued about.

| Vague | Checkable |
|---|---|
| "should work fine on large repositories" | WHEN a repository exceeds the indexing threshold, the system shall build the overview from deterministic facts alone, without reading every file in full. |
| "shouldn't crash if the model is unavailable" | IF the structured model call fails, THEN the system shall show a deterministic overview together with the reason for the degradation. |
| "should hint where to start reading" | The system shall order the reading path by each file's rank in the import graph. |

**Language.** Criteria are written in English, like every other line of the spec.
If the host repository's own instruction file states a different language
convention for requirements, follow it — and then name that language's trigger
words in the `Pattern` column, so a reader can still tell the five patterns apart.

**Citation to carry across.** Alistair Mavin, Philip Wilkinson, Adrian Harwood,
Mark Novak, *Easy Approach to Requirements Syntax (EARS)*, 17th IEEE
International Requirements Engineering Conference (RE'09), Atlanta GA, 31 August
– 4 September 2009, pp. 317–322. Record:
<https://research.manchester.ac.uk/en/publications/easy-approach-to-requirements-syntax-ears/>.
EARS came out of Rolls-Royce, where the authors were analysing airworthiness
regulations for a jet engine control system — which is why its patterns are built
around conditions and obligations rather than around user stories.
