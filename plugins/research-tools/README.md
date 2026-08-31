# research-tools

A generic, read-only `researcher` agent for delegated discovery: reading a
codebase, documentation or dependency to answer a specific question without
touching any files.

**Status: scaffold.** The agent is extracted in a follow-up pull request.

## Contents

_To be populated._

## Usage

```
research-tools:researcher
```

The agent is read-only by design. Its tool grant excludes every write, edit and
execute capability — see [docs/SECURITY.md](../../docs/SECURITY.md).

## Install

```bash
claude plugin install research-tools@dev-digest-ai-marketplace --scope project
```
