/**
 * All user-facing copy for one locale.
 *
 * Copy never lives inline in a component (docs/SITE-SPEC.md §
 * Internationalization): adding a language means adding a file beside this one
 * and listing it in `index.ts`, and touching no component at all.
 */
export const en = {
  'locale.name': 'English',

  'nav.skipToContent': 'Skip to content',
  'nav.home': 'Home',
  'nav.search': 'Search',
  'nav.whatsNew': "What's new",
  'nav.gettingStarted': 'Getting started',
  'nav.repository': 'Repository',
  'nav.brand': 'DevDigest AI Marketplace',

  'theme.toggle': 'Switch theme',
  'theme.dark': 'Dark',
  'theme.light': 'Light',
  'theme.system': 'System',

  'common.loading': 'Loading the catalog…',
  'common.loadError': 'The catalog could not be loaded.',
  'common.loadErrorHint':
    'The generated index is missing. Run `npm run build:index` before building the site.',
  'common.notFound': 'Not found',
  'common.notFoundBody': 'Nothing is published at {path}.',
  'common.backHome': 'Back to the catalog',
  'common.generatedAt': 'Catalog generated {date}',

  'copy.action': 'Copy install',
  'copy.command': 'Copy command',
  'copy.done': 'Copied to the clipboard',
  'copy.failed': 'Copy failed — select the text and copy it manually',

  'home.tagline':
    'A Claude Code plugin marketplace: the spec-driven development workflow and the shared engineering practices it builds on.',
  'home.addMarketplace': 'Add the marketplace',
  'home.plugins': 'Plugins',
  'home.stats.plugins': 'plugins',
  'home.stats.agents': 'agents',
  'home.stats.skills': 'skills',
  'home.stats.commands': 'commands',
  'home.stats.latestRelease': 'Latest release',
  'home.stats.noRelease': 'Nothing released yet',
  'home.stats.noReleaseHint':
    'Every plugin is at 0.0.0 until the first release is tagged.',

  'search.title': 'Search',
  'search.label': 'Search plugins and components',
  'search.placeholder': 'react best, layering, spec, read-only…',
  'search.hint': 'Plugins and individual components are both results.',
  'search.resultCount': '{count} results',
  'search.resultCountOne': '1 result',
  'search.empty': 'Nothing matches {query}.',
  'search.emptyHint': 'Try fewer words, or a part of a name.',
  'search.start': 'Type to search across every plugin and component.',
  'search.inPlugin': 'in {plugin}',
  'search.kind.plugin': 'Plugin',

  'plugin.version': 'Version',
  'plugin.author': 'Author',
  'plugin.license': 'License',
  'plugin.compatibility': 'Claude Code',
  'plugin.compatibilityUnknown': 'Not stated',
  'plugin.unreleased': 'Unreleased',
  'plugin.unreleasedHint':
    'This plugin has not been released. 0.0.0 is a placeholder, not an installable version.',
  'plugin.install': 'Install',
  'plugin.dependencies': 'Dependencies',
  'plugin.noDependencies': 'None. This is a leaf plugin.',
  'plugin.resolved': 'Also installed, transitively',
  'plugin.dependents': 'Depended on by',
  'plugin.contents': 'Contents',
  'plugin.noContents': 'No components.',
  'plugin.readme': 'README',
  'plugin.noReadme': 'This plugin ships no README.',
  'plugin.keywords': 'Keywords',

  'artifact.kind.agent': 'Agent',
  'artifact.kind.skill': 'Skill',
  'artifact.kind.command': 'Command',
  'artifact.kind.hook': 'Hook',
  'artifact.fromPlugin': 'Ships in',
  'artifact.model': 'Model',
  'artifact.tools': 'Tools',
  'artifact.noTools': 'No tool grant declared.',
  'artifact.reference': 'Reference',
  'artifact.referenceHint':
    'Address a component by its namespaced name. An unqualified name resolves against whatever the host repository happens to have installed.',
  'artifact.source': 'Source',

  'whatsNew.title': "What's new",
  'whatsNew.empty': 'No release has been published yet.',
  'whatsNew.emptyHint':
    'The feed is built from each plugin’s CHANGELOG.md. An Unreleased section is not a release and never appears here.',
  'whatsNew.undated': 'No date recorded',
  'whatsNew.tag': 'Tag',

  'gettingStarted.title': 'Getting started',
  'gettingStarted.step1': 'Add the marketplace',
  'gettingStarted.step1Body':
    'Adding a marketplace registers the catalog. It installs nothing on its own.',
  'gettingStarted.step2': 'Install a plugin',
  'gettingStarted.step2Body':
    'Dependencies are resolved and installed for you. Installing sdd-engineering also brings in the three plugins it depends on.',
  'gettingStarted.step3': 'Reload, then verify',
  'gettingStarted.step3Body':
    'Start a new session or run /reload-plugins, then confirm what is installed and that nothing reports an unsatisfied dependency.',
  'gettingStarted.step4': 'Configure only if you need to',
  'gettingStarted.step4Body':
    'Every input has a documented default, so a repository that accepts them all needs no configuration file. Add one only to override a default.',
  'gettingStarted.configNote':
    'Each plugin’s README lists its inputs, what it writes, and what happens when a command cannot be found.',
} as const;

export type CopyKey = keyof typeof en;
