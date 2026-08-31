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

A channel is a marketplace source pinned to a particular ref.

| Channel | Pinned to | Purpose |
|---|---|---|
| `dev-digest-ai-marketplace` | `main` | Current release. The default. |
| pinned re-declaration of the same name | A specific tag or SHA verified in production | The verified fallback |

**A marketplace name is bound to one source.** Adding this repository a second
time at a different ref fails:

```
✘ Failed to add marketplace: Cannot add marketplace "dev-digest-ai-marketplace":
  its network source differs from the one declared for it in settings … the
  source must match the one declared for this name in settings (or change the
  declaration).
```

The name comes from `marketplace.json`, which is the same at every ref, so a
second channel called `dev-digest-ai-marketplace-stable` **does not exist and
cannot be added** without publishing a marketplace manifest that carries that
name. This was found by rehearsing the rollback, not during an incident, which
is the entire reason to rehearse.

Until such a manifest exists, the fallback is a **re-declaration of the same
name at a pinned ref**: remove the declaration, add it back with `@<tag>`. The
procedure below is written that way.

## Going back to a previous version

**There is no `claude plugin rollback` command.** Going back is a normal install
from a channel pinned to the older ref:

0. **Write down what is installed now.** `claude plugin list`. You are about to
   lose it — see step 2.
1. **Re-declare the channel at the known-good ref.**

   ```bash
   claude plugin marketplace remove dev-digest-ai-marketplace
   claude plugin marketplace add devsiteua/dev-digest-ai-marketplace@<plugin>--v<version>
   ```

2. **Removing the declaration uninstalls every plugin that came from it** — not
   only the one being rolled back. Rehearsed: removing the channel left
   `sdd-engineering` and `research-tools` gone from the project, and only what
   was explicitly reinstalled came back. Budget for reinstalling the whole set,
   and this is why step 0 exists.
3. **Install from the pinned channel**, consumer first so its dependencies come
   with it:

   ```bash
   claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
   ```

4. `/reload-plugins`, or start a new session.
5. **Check the rolled-back code before spending a run.** The plugin cache keeps
   every version side by side under
   `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`, so the rollback
   is a pointer change and can be confirmed for free — grep the installed copy
   for something the newer version introduced and the older one does not have.
6. **Run the smoke eval. Going back is not done until it is green.** A code-level
   check says the right files are in place; only a run says the plugin still
   works.
7. Confirm the user did not lose plugin data. If the newer version could have
   changed state outside the plugin — files written into the host repository,
   anything with an external side effect — describe how to restore that state
   separately. Reinstalling a plugin does not undo what it did.
8. **Return the channel to the default** once the incident is over, and reinstall,
   or the repository stays pinned to an old tag and silently stops receiving
   fixes.

Return the default channel to `latest` only after the exact command sequence has
been recorded and rehearsed.

## Rehearsal

The path back is rehearsed on a schedule, not discovered during an incident.
Record the rehearsal date, the version returned to, and the smoke eval result in
the plugin's changelog.

### 2026-08-31 — `architecture-review` 1.1.0 → 1.0.0

The first rehearsal, and it found that the procedure as originally written did
not work. Three things it changed above:

| What the rehearsal found | What it changed |
|---|---|
| A second, differently-named stable channel cannot be added — the name is bound to one source | The fallback is a re-declaration of the same name at a pinned ref |
| Removing the channel uninstalled **all four** plugins, not just the one being rolled back | New step 0 (record what is installed) and an explicit warning in step 2 |
| The cache holds every version side by side, so the rollback can be verified before paying for a run | New step 5, a free code-level check before the smoke eval |

Evidence: with 1.0.0 active, the installed
`architecture-reviewer.md` contained **0** occurrences of the rule 1.1.0 added;
the 1.1.0 copy beside it contained **4**. The smoke eval then produced a full
review whose header carried absolute paths — 1.1.0's change reverted, exactly as
intended. Session `60cdc50a`, $0.712.
