import MiniSearch from 'minisearch';

import type { Index } from './types';

/**
 * One search over plugins *and* individual artifacts. Finding a skill without
 * already knowing which plugin ships it is the point of the search page
 * (docs/SITE-SPEC.md § Search).
 */
export interface SearchDoc {
  id: string;
  kind: 'plugin' | 'agent' | 'skill' | 'command' | 'hook';
  name: string;
  plugin: string;
  description: string;
  keywords: string;
  body: string;
}

export type SearchResult = SearchDoc & { score: number };

export function buildIndex(index: Index): MiniSearch<SearchDoc> {
  const search = new MiniSearch<SearchDoc>({
    fields: ['name', 'keywords', 'description', 'body'],
    storeFields: ['kind', 'name', 'plugin', 'description'],
    searchOptions: {
      // name highest, then keywords, then description, then body.
      boost: { name: 6, keywords: 3, description: 2, body: 1 },
      prefix: true,
      // Light: enough that `react best` finds `react-best-practices`, not so
      // much that every query matches everything.
      fuzzy: 0.2,
      combineWith: 'AND',
    },
    // Split on the punctuation that separates words in a namespaced id or a
    // kebab-case name, so `react-best-practices` is also three terms.
    tokenize: (text) => text.split(/[\s\-_.:/]+/).filter(Boolean),
  });

  const docs: SearchDoc[] = [
    ...index.plugins.map((plugin) => ({
      id: `plugin:${plugin.name}`,
      kind: 'plugin' as const,
      name: plugin.name,
      plugin: plugin.name,
      description: plugin.description,
      keywords: plugin.keywords.join(' '),
      body: '',
    })),
    ...index.artifacts.map((artifact) => ({
      id: artifact.id,
      kind: artifact.kind,
      name: artifact.name,
      plugin: artifact.plugin,
      description: artifact.description,
      keywords: [...artifact.keywords, ...artifact.tools].join(' '),
      body: '',
    })),
  ];

  search.addAll(docs);
  return search;
}

/** Fold body text in once the Markdown has been fetched, without re-creating the index. */
export function addBody(
  search: MiniSearch<SearchDoc>,
  doc: SearchDoc,
  body: string
): void {
  if (search.has(doc.id)) search.discard(doc.id);
  search.add({ ...doc, body });
}
