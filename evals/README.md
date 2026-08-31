# Behavior evals

`claude plugin validate` checks that a plugin's files are shaped correctly. It
cannot tell you whether the composition does the intended work. These cases
cover the promises the plugin READMEs make:

- an absent optional command is **reported and continued past**, never guessed
  around;
- a required command that is missing is **named**, and the step stops;
- an unrecognised path gets **no practice**, not the nearest-looking one;
- a read-only agent **cannot write**, and says so rather than silently failing;
- a request with no scope is **refused cheaply**, before any work is done.

## Running them

```bash
npm run eval:dry      # parse every case, check fixtures and regexes — costs nothing
npm run eval          # run the suite for real
node evals/run.mjs --case missing-guard          # one case
node evals/run.mjs --ablation                    # add a no-plugin baseline arm
node evals/run.mjs --json evals/results/run.json # machine-readable results
```

Every run of the real suite spends money: each case starts a `claude -p` session
with the plugins loaded. `--dry-run` exists so that a typo in a regex or a
missing fixture is found for free.

Results are written under `evals/results/` and are **not committed** — they are
a record of one run on one machine, and a stale one reads as a current claim.

## Why this runner and not `claude plugin eval`

`claude plugin eval` is the right long-term home: it is the native harness, it
reads `<plugin>/evals/`, and it has an ablation mode and a scoring report this
runner does not try to reproduce.

It is **gated behind early access** and refuses to run for this account:

```
$ claude plugin eval init --bare read-only-report
`plugin eval` is currently in early access
```

Its `case.yaml` schema is not documented outside the tool, and the CLI binary
does not surface it. Writing cases against a guessed schema would produce files
nobody can run — the same mistake as creating an empty file to satisfy a
checklist. So the cases here use a small format this repository can actually
execute today.

**Migration, when early access opens:** the cases already live where the native
tool looks for them (`plugins/<name>/evals/`), and each one is a prompt plus a
list of assertions — the same two ingredients as `prompt.md` + `graders/`.
Translate the frontmatter, delete `evals/run.mjs`, and keep the fixtures.

## Case format

One file per case, `plugins/<plugin>/evals/<name>.case.md`: frontmatter, then
the prompt.

```markdown
---
name: missing-guard
negative: true              # this case asserts something must NOT happen
fixture: no-manifest        # copied to a throwaway directory; the run happens there
plugins:                    # which plugin dirs to load (default: the owning plugin)
  - architecture-review
  - engineering-paved-path
files_unchanged: true       # fail if the run modified the fixture at all
timeout_seconds: 600
expect:
  - contains: "ARCHITECTURE.md"
  - absent: "pnpm arch:check"
  - matches: "(guard|architecture check)[^\\n]*not found"
  - not_matches: "npm test"
---
The prompt sent to `claude -p`.
```

**Escapes in a double-quoted grader follow YAML's rules**: `\\` is one
backslash, so `matches: "pricing\\.js"` reaches the regex engine as
`pricing\.js`. Single quotes are literal. The first real run of this suite
failed on exactly this — the escape was not applied, one grader matched nothing
and a neighbouring one passed *by luck* — so `--dry-run` now rejects a pattern
with a surviving `\\`. A grader that cannot match anything is worse than a
missing one: it passes the suite while checking nothing.

**A grader needs a constrained line to grade.** Two cases here ask for a
labelled first line — `TEST_COMMAND: NONE`, `AGENT_MADE_THE_CHANGE: no` — and
grade that, because free-form prose defeats text matching in a specific way: an
agent explaining *"writing `Verify: npm test` here would be fabricating a
command"* contains the exact string a naive grader forbids. The grader cannot
tell use from mention; a one-line field can. Both cases failed this way on their
first run, and the fix was to narrow what is graded, never to loosen the rule.

**Graders are deterministic on purpose.** An LLM judge would make the suite's
own verdict as variable as the thing it is judging, and every promise checked
here is literal enough to match on. `files_unchanged` is the strongest grader in
the set: it compares a hash of every file before and after, so "read-only" is
checked rather than believed.

## What `files_unchanged` does and does not prove

It hashes every file before and after the run, so it is the strongest grader
here — but it measures **the whole session**, not one agent.

The `refuses-to-write` case originally carried it and failed: the `researcher`
agent correctly reported that it cannot edit, and the orchestrating session then
made the edit itself, with its own tool grant. Nothing was wrong with the plugin;
the grader was asserting something the plugin never promised.

So `files_unchanged` belongs on cases where **nothing should write at all**
(`read-only-report`, `missing-guard`), and a case about one agent's grant asserts
on that agent's own words instead. The distinction is real and it is documented
in [research-tools' README](../plugins/research-tools/README.md): a read-only
agent does not make the session read-only.

## Fixtures

Small repositories, each shaped to make one absence matter:

| Fixture | What it is | What it exercises |
|---|---|---|
| `no-manifest` | Architecture documentation, three source files, **no `package.json`** | Discovery finds no architecture check; the reviewer must report `not found` and review anyway |
| `no-test-script` | A manifest with `start` and `lint` and **no test or typecheck script** | A command that is required and missing must be named, and `lint` must not be substituted for it |

Each case runs against a copy in a temporary directory, so a case that writes
cannot damage the fixture and `files_unchanged` is meaningful.

## What is not covered yet

- **The full workflow end to end** — spec → plan → run → verify. It needs a
  fixture with a spec and a plan, and it is several agent runs per case.
- **`/workflow-retro deep`**, which reads session logs that only exist after a
  real multi-agent run.
- **The catalog site.** Its acceptance checks are in the browser, not here.
