# Releases

## Versioning

Every plugin is versioned independently with [SemVer](https://semver.org/).
The version lives in `plugins/<name>/.claude-plugin/plugin.json` and nowhere
else — `marketplace.json` does not restate it.

| Bump | When |
|---|---|
| **Major** | A workflow that worked stops working: a component removed or renamed, a required input added, a tool grant narrowed, a dependency range widened in a way consumers must react to. |
| **Minor** | New backward-compatible behavior: a new agent or skill, a new optional input, a stricter *internal* quality bar that does not change the interface, a new dependency. |
| **Patch** | A fix with no interface change: wording, a corrected reference, a prompt fix that makes the documented behavior actually happen. |

A prompt change is a behavior change. "It is only a prompt" is not a reason to
ship without a version bump.

## Release order

Dependencies first, consumers second, always:

```
engineering-paved-path  →  research-tools  →  architecture-review  →  sdd-engineering
```

Releasing a consumer against an unreleased dependency produces
`no-matching-tag` at install time in someone else's repository, where it is
somebody else's problem to debug.

## Tags

Git-backed dependencies are resolved by tag, in this exact convention:

```
engineering-paved-path--v1.0.0
research-tools--v1.0.0
architecture-review--v1.0.0
sdd-engineering--v1.0.0
```

From the plugin's directory:

```bash
cd plugins/sdd-engineering
claude plugin tag --dry-run     # verify the manifest and the tag it would create
claude plugin tag --push        # create and push the tag
```

The command reads the manifest and builds the tag from the convention. Do not
create these tags by hand.

## Release checklist

1. `CHANGELOG.md` updated with the new version, dated, newest first.
2. `version` bumped in `plugin.json`.
3. `claude plugin validate .` green.
4. Behavior evals green — the existing set **and** the ones added for the new
   behavior. Negative evals included.

   ```bash
   npm run eval
   ```

   CI runs only `npm run eval:dry`, which proves the cases parse and nothing
   more: a real run starts a model session per case, so it costs money and needs
   credentials CI does not have. **The full run is a human step, here, before the
   tag** — a release whose evals were never run has a checklist tick and no
   evidence. Record the run's case count and total cost in the changelog entry
   beside the SHA.
5. The commit is merged to `main` and CI passed on that exact SHA.
6. `claude plugin tag --dry-run`, then `--push`.
7. Record the SHA in the changelog entry.

A tag must permanently point at a commit that passed CI. Never move a tag that
has been pushed — a consumer may already have resolved it.

### Release order for 1.0.0

The graph decides it: dependencies first, consumers second, so that a consumer
is never tagged against a dependency nobody can resolve.

```
1. engineering-paved-path--v1.0.0     leaf
2. research-tools--v1.0.0             leaf
3. architecture-review--v1.0.0        depends on engineering-paved-path
4. sdd-engineering--v1.0.0            depends on all three
```

`claude plugin tag --dry-run ./plugins/<name>` prints the exact `git tag` and
`git push` it would run, and refuses on a dirty working tree. Run it for all
four before running any of them with `--push`.

## Update, from the consumer's side

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update sdd-engineering@dev-digest-ai-marketplace --scope project
```

These are two separate operations and they fail separately. The first refreshes
the catalog; the second moves the installed plugin. Verify both:

```bash
claude plugin list --json
```

Then start a new session or run `/reload-plugins`. A plugin already loaded into
a running session does not change underneath it.

## Channels

A channel is a marketplace source pinned to a particular ref. The pattern:

| Channel | Pinned to | Purpose |
|---|---|---|
| `dev-digest-ai-marketplace` | `main` | Current release. The default. |
| `dev-digest-ai-marketplace-stable` | A specific tag or SHA of a version that has been verified in production | The verified fallback |

The stable channel is prepared **before** it is needed, not during the incident.

## Going back to a previous version

**There is no `claude plugin rollback` command.** Going back is a normal install
from a channel pinned to the older ref:

1. Add or update the stable channel, pinned to the ref or SHA of the known-good
   release.
2. Uninstall the plugin from the current channel, or disable that channel, so the
   two sources cannot both satisfy the dependency.
3. Install the plugin from the stable channel.
4. `/reload-plugins`, or start a new session.
5. Run the smoke eval. Going back is not done until the eval is green.
6. Confirm the user did not lose plugin data. If the newer version could have
   changed state outside the plugin — files written into the host repository,
   anything with an external side effect — describe how to restore that state
   separately. Reinstalling a plugin does not undo what it did.

Return the default channel to `latest` only after the exact command sequence has
been recorded and rehearsed.

## Rehearsal

The path back is rehearsed on a schedule, not discovered during an incident.
Record the rehearsal date, the version returned to, and the smoke eval result in
the plugin's changelog.
