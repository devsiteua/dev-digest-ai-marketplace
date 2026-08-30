## What changed

<!-- One or two sentences. Which plugin, and what does it now do differently? -->

## Why

<!-- The consumer scenario this serves. Link the issue if there is one. -->

## Version

<!-- Delete the lines that do not apply. -->

- [ ] `version` bumped in `plugins/<name>/.claude-plugin/plugin.json`
- [ ] `CHANGELOG.md` updated for every plugin whose version changed
- [ ] Nothing shipped — no version change is correct here, because: …

Bump reasoning (see [docs/RELEASES.md](../docs/RELEASES.md)): **major / minor / patch**, because …

## Checks

- [ ] `claude plugin validate .` passes
- [ ] `npm run build:index` passes
- [ ] `cd site && npm ci && npm run build` passes
- [ ] Behavior evals run, including a negative eval where the workflow must not trigger

## Review checklist

- [ ] Manifest `name` matches the directory name and the `marketplace.json` entry
- [ ] No secrets, credentials or absolute paths ([docs/SECURITY.md](../docs/SECURITY.md))
- [ ] No assumptions about a specific repository's layout — repository-dependent
      values are explicit inputs with a documented default and fallback
- [ ] `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_SKILL_DIR}` used instead of relative guesses
- [ ] Components from dependencies referenced by namespaced name
- [ ] Tool grants reviewed; any widening is explained above
- [ ] No instruction duplicated between an agent prompt and a skill
- [ ] Generated files (`site/public/*.json`, `site/public/bodies/`, `site/dist/`)
      are not in the diff
