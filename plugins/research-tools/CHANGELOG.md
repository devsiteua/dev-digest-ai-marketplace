# Changelog

All notable changes to `research-tools` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this plugin follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The `researcher` agent: read-only repository and external research, returning a
  structured report with a conclusion, an evidence table citing `file:line` or a
  fetched URL, and an explicit list of what it could not find.

### Changed

- Extracted from the source repository with no references to it. The prompt is
  otherwise faithful; the generalizations are the removal of one repository's
  claims about its own code (inline shape re-declaration, its instruction and
  insights file names) and making the presence of a package manifest optional.

### Removed

- **`Bash` from the agent's tool grant.** In its original home a `PreToolUse`
  hook enforced read-onlyness at the harness level; that hook does not travel
  with the plugin, and `Bash` can write. The tool grant is now the boundary. The
  prompt's rules about which shell commands were permitted went with it, as did
  the agent's ability to read version-control history — which it now reports as a
  limitation instead of guessing.
