# research-tools

A generic, read-only `researcher` agent for delegated discovery: reading a
codebase, documentation or a dependency to answer a specific question without
touching any files.

## Contents

| Reference | Kind |
|---|---|
| `research-tools:researcher` | agent |

## Usage

```
research-tools:researcher
```

Give it a concrete question, a scope (repository, external sources, or both) and
what you will do with the answer. It returns a structured report: conclusion
first, then an evidence table where every row cites a `file:line` it read or a
URL it fetched, then an explicit list of what it could not find. If the question
is too vague to research, it asks up to three questions and does nothing else.

## Inputs and configuration

None. This plugin reads no configuration file, has no paths to set and makes no
assumption about the host repository's layout, ecosystem or package manager. It
runs in a repository with no `package.json`, no lockfile and no tests, and
returns a report rather than an error.

## Tool grant

```
Read, Grep, Glob, WebSearch, WebFetch, TodoWrite
```

**`Bash` was removed during extraction.** In the repository this agent came from,
its read-onlyness was enforced twice: by its own prompt, and by a `PreToolUse`
hook that rejected mutating commands. That hook belongs to that repository — a
plugin does not install hooks into a host repository's settings — so after
extraction the prompt would have been the only thing standing between the agent
and a write, and `Bash` can write (`>`, `tee`, `sed -i`, `git checkout`).

[docs/SECURITY.md](../../docs/SECURITY.md) makes the tool grant the boundary
rather than the prompt: a read-only agent must actually be unable to write.
`Read`, `Grep` and `Glob` cover every read the agent genuinely needs.

**What this costs.** The agent can no longer read version-control history, so it
cannot answer "why is it like this" from the log. It reports that as a limitation
and names the command you can run yourself, rather than guessing at a commit.

## Network access

`WebSearch` and `WebFetch` are part of the tool grant, and external research is
half the agent's stated purpose. They need no credentials and reach nothing
private. The agent sends the question it was asked; it does not upload repository
content.

## Writes

None. The agent's only output is its report, returned to the caller.

**This does not make your session read-only.** The tool grant binds the
`researcher` agent, not the session that calls it. Ask for a change through this
agent and it will report that it cannot make one — but the orchestrating session
still has whatever tools it was started with, and may go on to make the change
itself. That is the harness working as designed, not the plugin leaking; if you
need the whole session unable to write, restrict the session's own grant.

Measured, not assumed: this is what the `refuses-to-write` eval case found on its
first run, and it is why that case asserts on the agent's own words rather than
on the state of the tree.

## Dependencies

None. This is a leaf plugin and stays one.

## Install

```bash
claude plugin install research-tools@dev-digest-ai-marketplace --scope project
```
