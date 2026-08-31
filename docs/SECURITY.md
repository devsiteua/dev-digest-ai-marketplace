# Security policy

A plugin published here is executed inside other people's repositories, with
their credentials on the machine and their source code in context. Treat every
manifest and every prompt as code that ships to production.

## Never in this repository

- **Secrets of any kind.** API keys, tokens, cookies, connection strings,
  passwords, private URLs with embedded credentials. Not in a manifest, not in a
  prompt, not in an example, not in a test fixture, not in a comment.
- **Absolute paths.** `/Users/...`, `/home/...`, `C:\...`. They leak the author's
  machine layout and break everywhere else. Use `${CLAUDE_PLUGIN_ROOT}` and
  `${CLAUDE_SKILL_DIR}`.
- **Assumptions about a specific repository's structure.** A hardcoded module or
  directory name from the repository a component was extracted from is a defect,
  even when it happens to work.
- **Network access that is not declared.** Any component that reaches the network
  or needs credentials belongs in an optional integration plugin, is documented
  in that plugin's README, and is never a dependency of a core workflow plugin.
- **Instructions that disable a safety check** in the host repository — skipping
  hooks, bypassing branch protection, forcing a push, committing on behalf of the
  user without being asked.

## Tool grants

The tool grant of an agent is a security boundary. Review it at extraction time
and again at every release:

| Agent kind | Allowed |
|---|---|
| Researcher | read and search only |
| Reviewer | read, search, and writing its own report |
| Planner | read, search, and writing the plan |
| Implementer | read, search, edit and execute |

Widening a tool grant is a reviewable change on its own. Say in the pull request
why the narrower grant was not enough.

## Data handling

- A plugin does not send repository content anywhere. Discovery, analysis and
  review all happen in the session the user already started.
- A plugin does not read outside the repository it runs in, except for files
  inside its own plugin directory or its dependencies.
- A plugin does not write outside paths it has documented in its README.

## Reporting a vulnerability

Open a **private** security advisory on
`github.com/devsiteua/dev-digest-ai-marketplace` — Security → Advisories → Report
a vulnerability. Do not open a public issue and do not open a pull request with
the fix first: the pull request is the disclosure.

Include the plugin name, the released version, what an attacker can achieve, and
the smallest reproduction you have.

## If an unsafe release shipped

Speed matters more than tidiness, in this order:

1. **Contain.** Remove the affected version from the marketplace listing so no
   new installation picks it up. Do not delete the tag yet — it is the evidence.
2. **Announce.** Publish a security advisory naming the affected versions, the
   impact, and the immediate action an installed user must take. Assume users do
   not read changelogs.
3. **Rotate.** If any credential could have been exposed, it is compromised.
   Rotate it before investigating how likely the exposure was.
4. **Direct users to a known-good version.** Publish the pinned stable channel
   ref from [RELEASES.md](RELEASES.md) and give the exact command sequence. There
   is no `plugin rollback` command — do not invent one.
5. **Fix forward.** Release a patched version and yank the bad one only after the
   replacement is installable.
6. **Write it up.** Add a dated entry to the plugin's `CHANGELOG.md` under
   `Security`, and record in the pull request which check would have caught this.
   A postmortem that does not change a check has not finished.

## Pre-release check

```bash
git grep -nE '(/Users/|/home/|[A-Za-z]:\\\\)' -- plugins/
git grep -niE '(api[_-]?key|secret|token|password|bearer)' -- plugins/
```

Both must come back empty, or every hit must be an explanation of why not to do
the thing.
