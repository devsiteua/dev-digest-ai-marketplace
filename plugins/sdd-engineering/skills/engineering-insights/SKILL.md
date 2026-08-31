---
name: engineering-insights
description: "Reads and appends engineering insights to the insights journal of the package a task touches, discovering the repository's packages rather than assuming them. Use at the start of a task to load what earlier sessions learned about that package, and before wrapping up a session to record anything non-obvious that surfaced — a surprising cause, a dead end, a convention the code does not announce, a dependency quirk. Trigger terms: insights, INSIGHTS.md, learnings, wrap up, what did we learn, lessons learned."
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Engineering Insights

Append-only journal of what this repository taught us the hard way. Read it before you work,
write to it before you stop.

It is the counterpart of `sdd-engineering:workflow-retro`, and they do not overlap: this
records what we learned about the **code**; the retro ledger records what we learned about a
**run**.

## 1. Find the journal, then route to one file

**The packages are discovered, never known** — see
`${CLAUDE_PLUGIN_ROOT}/references/host-configuration.md` § Packages. A single-package
repository is the normal case, and there the routing below collapses to one file.

**The journal's filename** is `INSIGHTS.md` by convention, at the root of the repository and
at the root of each package. If this repository already keeps such a journal under another
name — look for one before creating anything — use the name it already uses. Do not start a
second journal beside an existing one.

| The task touched | The file |
|---|---|
| exactly one discovered package | that package's journal |
| two or more packages | the repository-root journal |
| paths that belong to no package — build configuration, scripts, documentation, CI | the repository-root journal |
| a shared contract that exists in copies inside more than one package | the repository-root journal, because the lesson is about the pair |

## 2. Read first — always, both directions

**At the start of a task:** read the routed file and the root file before touching code.
Treat entries as high-confidence guidance unless the code contradicts them.

**Before writing:** read them again. If the finding is already there, **stop — write
nothing**. Do not restate it, do not add a near-duplicate under a different heading. If an
existing entry has become wrong, append a dated correction; never rewrite history.

## 3. Write only what clears the bar

Keep the entry only if it is all four:

- **non-obvious** — not clear to someone who just read the code
- **specific** — names a file, symbol, number, or command
- **actionable cold** — the next reader knows what to do without asking anyone
- **durable** — still true next month

✗ "Promises can be tricky" · "be careful with async" — noise, not a lesson
✓ "`Promise.all()` on the ingest pipeline times out past 30 items — use `Promise.allSettled()`
in batches of 10"

If nothing clears the bar, write nothing and say so. A session with no entry is a normal
outcome, not a failure.

## 4. Append

Under the matching `##` section, newest first. Never overwrite, reorder, or delete.

```
### YYYY-MM-DD · One-line title
Trigger:  what we were doing / what we saw
Cause:    what was actually going on
Takeaway: what to do differently next time
Evidence: path/to/file.ts:LINE
Status:   open | resolved | → promoted to <file>
```

Sections, in fixed order in every file:

| Section | For |
|---|---|
| What Works | an approach that was tried and held up — reuse it |
| What Doesn't Work | a dead end or antipattern. **Most valuable, most often left empty** |
| Codebase Patterns | a convention or architectural decision the code does not announce |
| Tool & Library Notes | a quirk of a dependency, CLI, or the local environment |
| Recurring Errors & Fixes | a symptom seen more than once, with its fix |
| Session Notes | a dated summary, only when no single entry captures the session. Sparingly |
| Open Questions | left unresolved, so the next session does not re-derive it |

**Creating the journal.** If the routed file does not exist, create it with those seven
sections and nothing else, and say in your report that you created it. That is the one file
this skill creates.

**Promotion:** an entry that saves us twice becomes a one-line rule in the repository's own
instruction file — discovered, per `host-configuration.md` § Per-package instructions — and
its `Status` here becomes `→ promoted to <file>`. If this repository has no instruction file,
the entry stays here and its status says so; **do not create one.** Deciding that a
repository should have an instruction file is not this skill's call.

Files are written in English. Keep each under ~250 lines. Over budget, spill to
`docs/insights-archive.md`: verbatim, under the same section, with a `> Archived …`
blockquote left at the foot of the section listing the dates that left. Only `→ promoted` and
`resolved` entries whose lesson has shipped qualify — an `open` entry never moves, and
neither does a resolved one an open entry points at.

## 5. What this skill writes

Only the journal it routed to, and only by appending. It touches no source file, no
configuration, no instruction file, and no second journal. Every path it may write is listed
in the plugin README.
