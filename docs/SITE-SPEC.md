# Catalog site specification

The CLI installs plugins. The site exists for **discovery**: find a plugin or an
individual skill, read its documentation, see its dependencies, copy the install
command.

Out of scope for the first version: a backend, ratings, download counters,
authentication, comments.

## Stack

React, TypeScript and Vite, deployed to GitHub Pages from `site/dist/`.

Hash routing, because GitHub Pages serves static files and has no rewrite rule
to send unknown paths to `index.html`.

## Routes

| Route | Page |
|---|---|
| `#/` | Home — what this marketplace is, the four plugins, the install command |
| `#/search` | Search across plugins and individual artifacts |
| `#/plugin/<name>` | Plugin detail |
| `#/artifact/<id>` | A single skill, agent or command |
| `#/whats-new` | Release feed built from changelogs |
| `#/getting-started` | Adding the marketplace and installing a first plugin |

## Build-time index

`scripts/build-index.mjs` reads `.claude-plugin/marketplace.json`, every plugin
manifest, README, changelog, compatibility file and component frontmatter, and
writes:

```
site/public/
├── index.json      plugins and artifacts, with search fields
├── releases.json   the release feed
├── stats.json      counts shown on the home page
└── bodies/         rendered-on-demand Markdown, one file per artifact
```

None of it is committed. It is generated in CI before every build.

### `index.json`

```jsonc
{
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "marketplace": { "name": "...", "owner": "...", "description": "..." },
  "plugins": [
    {
      "name": "sdd-engineering",
      "version": "1.0.0",
      "description": "...",
      "author": "AI Engineering",
      "license": "MIT",
      "homepage": "...",
      "keywords": ["..."],
      "dependencies": [{ "name": "...", "version": "^1.0.0" }],
      "compatibility": { "claudeCode": ">=2.1.110" },
      "artifacts": ["sdd-engineering:spec-creator", "..."],
      "bodyId": "sdd-engineering"
    }
  ],
  "artifacts": [
    {
      "id": "sdd-engineering:spec-creator",
      "kind": "agent",          // agent | skill | command | hook
      "name": "spec-creator",
      "plugin": "sdd-engineering",
      "description": "...",     // from frontmatter
      "keywords": ["..."],
      "bodyId": "sdd-engineering--agent--spec-creator"
    }
  ]
}
```

`bodies/<bodyId>.md` holds the full Markdown, fetched only when a detail page
opens. Keeping bodies out of `index.json` is what lets the whole index load on
first paint.

### `releases.json`

One entry per released version, parsed from each plugin's `CHANGELOG.md`,
newest first: `plugin`, `version`, `date`, `sections` (Added / Changed / Fixed /
Security), `tag`.

### `stats.json`

Counts for the home page: plugins, artifacts by kind, the newest release date.
Never a fabricated number — if a value cannot be computed, the field is absent
and the UI says so.

## Search

[MiniSearch](https://github.com/lucaong/minisearch), built in the browser from
`index.json`. Indexed fields: `name`, `description`, `keywords`, and the README /
`SKILL.md` text. Field boosts: `name` highest, then `keywords`, then
`description`, then body. Prefix matching and light fuzziness on, so `react best`
finds `react-best-practices`.

Plugins and individual artifacts are both results. Finding a skill without
already knowing which plugin ships it is the point of the search page.

## Markdown rendering

Rendered with [`marked`](https://marked.js.org/), then **always** passed through
[DOMPurify](https://github.com/cure53/DOMPurify) before it reaches the DOM.

This is not optional. The catalog renders content from a repository that accepts
pull requests; repository content is not trusted HTML. There is no code path
that sets `innerHTML` from Markdown without sanitizing first.

## Plugin detail page

Shows, at minimum:

- name, version, description, author, license
- compatibility — the minimum Claude Code version
- dependencies, each linking to its own plugin page
- contents — every agent, skill, command and hook, linking to its artifact page
- the install command with a **Copy install** button:

  ```
  /plugin install sdd-engineering@dev-digest-ai-marketplace
  ```

- the rendered README

Version and dependencies must match the manifest exactly. They come from the
same generated index, so a mismatch means the index is stale — rebuild rather
than editing the UI.

## Internationalization

Copy lives in a separate translations module, not inline in components. Adding a
language must not require touching a component.

## Accessibility and theming

Dark-first, with a light theme available. Keyboard-navigable search results.
Visible focus states. Copy buttons announce the result of the copy.

## Local run

```bash
npm run build:index
cd site && npm ci && npm run build && npm run preview
```

## Acceptance

- A plugin and its nested skills are all findable through search.
- Version and dependencies on the detail page match the manifest.
- **Copy install** copies the correct, complete command.
- No Markdown reaches the DOM without passing through DOMPurify.
- Neither generated JSON nor `site/dist/` appears in a commit.
