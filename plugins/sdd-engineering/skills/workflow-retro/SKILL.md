---
name: workflow-retro
description: "Reports what a multi-agent run actually cost and proposes concrete changes to the files that caused it: which agents were launched and in what order, how many tokens each one spent, what was easy, what was hard, what information was duplicated between contexts, and what was missed. Output goes to chat and as one appended entry in the repository's retro ledger. Manual only — nothing launches it, and it launches nothing. Trigger terms: retro, retrospective, workflow retro, what did that run cost, how much did it cost, token usage, post-mortem on the run."
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Workflow Retro

The only thing in this pipeline that looks backwards. A run happened; this says what it cost,
where the cost went, and which file to change so the next one costs less.

Invoke as `/workflow-retro [deep] [--plan <path>]`.

**What this is not.** Not a code review and not a verification — the review gate and
`sdd-engineering:plan-verifier` already returned their verdicts, and repeating them here
wastes the one chance to talk about the *process*. Not a lessons journal either:
`sdd-engineering:engineering-insights` records what we learned about the **code**, this
ledger records what we learned about the **run**.

## 1. Manual only

Nothing triggers this. No hook, no agent, no other skill, no settings entry — and
`sdd-engineering:run-plan` does not call it either, deliberately: a retro that fires
automatically at the end of every run becomes a footer nobody reads, and it would charge a
full analysis pass to runs that had nothing to analyse.

It also launches nothing. It reads what is already in this session's context, or what is on
disk under `deep`, and writes one file. A retro that spends a subagent to measure subagent
spending has answered its own question badly.

## 2. Modes

| Mode | Reads | Use when |
|---|---|---|
| default | **this session's context only** — the agents you saw launched, their reports, the commands you watched run | the run just happened, in this session |
| `deep` | the above **plus this session's own logs on disk** | the run was in another session, or the numbers matter more than the recollection |

### `deep` reads outside the repository — say so before you do it

This is the one place in `sdd-engineering` that reads a file outside the host repository:
the Claude Code session logs under the user's own `~/.claude/projects/` directory. It is
local, it is read-only, it is the user's own data, and **nothing leaves the machine** — the
numbers are aggregated by a script and only the totals reach the model's context.

It also happens only when the caller types `deep`. Name the directory you are about to read
in your first line of output. Never read it in the default mode.

**The session transcript is not where the agents are.** That was this skill's first mistake,
corrected on its first real run: the transcript carried **zero** turns marked as a sidechain
for a run of eight subagent launches. Every subagent number came from the task output files
instead.

| Read | Where | Carries |
|---|---|---|
| the main session | `~/.claude/projects/<cwd-slug>/*.jsonl`, one JSON object per line | the session's own turns — its `usage` is the orchestration cost, not the agents' |
| **each subagent** | the task output files this session wrote, one per launch — the path is named in the tool result that launched the agent | that agent's whole run |

Both files carry the same per-turn shape, verified rather than assumed:

| Field | Carries |
|---|---|
| `message.usage` | `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` per assistant turn |
| `message.model` | which model that turn ran on — this is how a model override is proved, not assumed |
| `timestamp`, `sessionId`, `gitBranch`, `cwd` | when, where, on which branch |

**Never read a task file into your context** — it is a full transcript and it will not fit.
Aggregate it with the script that ships beside this skill:

```sh
python3 "${CLAUDE_SKILL_DIR}/scripts/analyze_journals.py" <file-or-directory> [more…]
```

It prints one row per file — that is one row per agent launch — plus a total, and nothing
else. Summing a directory into a single number hides which agent spent the money, which is
the only question worth asking.

Cache reads are not the same money as fresh input; the script reports them as their own
column and so should you. On the first real run one agent held 66% of all cache reads, and
that was the entry's leading proposal.

**A retro with no run to analyse says so.** No agents in context and no `deep` on disk is a
one-line answer — "nothing to analyse; run `deep` to read from disk, or point me at a plan" —
and no ledger entry. Inventing plausible numbers for a run that did not happen would poison
every comparison the ledger exists to make.

## 3. What to measure

Six questions, in this order. Each one is answered from evidence, and where there is no
evidence the answer is "not measured", never an estimate dressed as a number.

1. **Which agents ran, and in what order.** The sequence, not just the set: `implementer →
   architecture-reviewer → implementer → plan-verifier` is a different run from the same four
   agents in a different order, and the order is where the waste usually is.
2. **What each one spent.** Tokens per agent, cache reads separate from fresh input, and the
   wall-clock if you have it. The largest number gets a sentence explaining itself.
3. **What was easy.** The stages that needed no correction. These are the ones to leave
   alone — a retro that only lists problems invites changes to the parts that were working.
4. **What was hard.** Every place a human had to intervene, a step went red, a fix iteration
   was spent, or an agent asked a question the file it was given should have answered.
5. **What was duplicated.** The same file read by three contexts, the same convention
   restated in two prompts, the same finding reported by two lanes. Duplication between
   contexts is the characteristic cost of a multi-agent pipeline and the easiest to remove.
6. **What was missed.** What the run should have caught and did not — found later by a
   review, by a test, by the user. A miss with no proposal attached is just a complaint.

## 4. Proposals

The section the whole skill exists for. **Every proposal names the file it changes** — an
agent file, a skill file, an instruction file, a template. A proposal that cannot name a file
is an observation, and it belongs in §3 instead.

```
- <what to change> → `<path/to/file.md>` § <section>
  Because: <the measurement in §3 that produced this, with its number>
  Costs: <what gets worse if we do it>
```

Three rules that keep the list honest:

- **Ranked by the money.** The proposal that addresses the largest number goes first. A
  wording improvement above a 40k-token duplication is a retro optimising itself.
- **`Costs:` is mandatory.** Every removal loses something. A proposal that claims no
  downside has not been thought about, and the next reader cannot weigh it.
- **A proposal is not a change.** Nothing here edits an agent or a skill. The human decides,
  and the decision is a commit of its own.

**A proposal that names a file inside an installed plugin** — one of these agent or skill
files — is a proposal against the plugin, not against this repository. Say so, and say that
acting on it means an issue or a pull request upstream, not an edit to an installed copy that
the next update overwrites.

## 5. Write one entry, print the diff

Append **one** entry to the retro ledger, newest last.

The ledger path is the `retroLedger` input — default `docs/retro/ledger.md`, resolved per
`${CLAUDE_PLUGIN_ROOT}/references/host-configuration.md`. **If the file does not exist,
create it** with this header and then append the entry beneath it:

```markdown
# Retro ledger

One entry per multi-agent run, newest last. Appended by
`sdd-engineering:workflow-retro`; never rewritten, never reordered.

Each entry: the plan, the date, the agent sequence, the tokens per agent with cache reads
counted separately, what was easy, hard, duplicated and missed, and the ranked proposals
with their costs. A number that was not measured is written `not measured`.
```

If the ledger already exists, follow whatever entry template it carries — an existing ledger's
shape wins over this one, because comparability between entries is the only reason to keep a
ledger.

Append — never rewrite, never reformat an older entry, never "tidy up" the file. A file that
rewrites itself is not a ledger, and the comparison between run three and run seven is the
only reason to keep one.

Print to chat the **summary and the proposals**, plus the entry you just appended — not the
whole ledger. The reader already has the file; what they need is what changed in it.

Both outputs, always: chat alone loses the entry the moment the session ends, and the file
alone loses the conversation the proposals came from.

## 6. Report

```
Workflow retro — <plan path> · <date> · mode: default | deep

Agents      implementer → architecture-reviewer → implementer → plan-verifier
Tokens      142k total · implementer 88k (62%) · reviewer 31k · verifier 23k
            cache reads 210k, counted separately
Easy        <one line>
Hard        <one line>
Duplicated  <one line, with the number>
Missed      <one line>

Proposals
  1. <change> → `<file>` § <section>
     Because: <number>   Costs: <what we lose>
  2. …

Ledger: <retroLedger path> — one entry appended (<n> total) | created and one entry written
```

Numbers that were not measured are written `not measured`. A retro whose credibility rests on
an invented token count is worth less than no retro, because the ledger's whole value is that
run seven can be compared with run three.
