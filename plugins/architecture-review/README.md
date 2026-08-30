# architecture-review

A generalized `architecture-reviewer` agent that reviews a change against the
architecture documentation of the repository it runs in, rather than against
hardcoded module names.

**Status: scaffold.** The agent is extracted in a follow-up pull request.

## Contents

_To be populated._

## Dependencies

- `engineering-paved-path@^1.0.0` — shared architecture and security practices

## Inputs

The reviewer takes the location of the host repository's architecture
documentation as an explicit input and documents its behavior when that
documentation is absent. It contains no assumptions about any particular
repository's directory layout.

## Usage

```
architecture-review:architecture-reviewer
```

## Install

```bash
claude plugin install architecture-review@dev-digest-ai-marketplace --scope project
```
