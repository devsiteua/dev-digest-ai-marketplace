# Compatibility

## Claude Code

**Minimum: 2.1.110.**

This marketplace uses version-constrained plugin dependencies, which is the
floor for every plugin published here. `research-tools` itself declares no
dependencies and uses no capability newer than that floor: one agent file with a
`name`, `description`, `tools` and `model` frontmatter.

## Host repository

No requirement. The agent makes no assumption about language, ecosystem, package
manager, directory layout or the presence of a manifest, a lockfile or tests.

## Network

`WebSearch` and `WebFetch` are in the tool grant. In an environment with no
network access, repository research works unchanged and external research fails
at the fetch; the agent reports what it could not reach rather than citing a page
it did not open.
