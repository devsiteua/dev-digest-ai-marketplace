import type MiniSearch from 'minisearch';
import { useEffect, useMemo, useRef, useState } from 'react';

import { t } from '../i18n';
import { toPlainText } from '../lib/markdown';
import { href, replaceHash } from '../lib/router';
import { addBody, buildIndex, type SearchDoc } from '../lib/search';
import type { Catalog } from '../lib/types';

const asset = (file: string) => new URL(file, document.baseURI).href;

/**
 * Body text is folded in after first paint.
 *
 * The index is usable immediately from names, keywords and descriptions; the
 * READMEs and SKILL.md bodies arrive in the background and are merged in. That
 * keeps the promise in docs/SITE-SPEC.md — bodies stay out of index.json so the
 * whole index loads on first paint — while still searching their text.
 */
function useSearchIndex(catalog: Catalog) {
  const search = useMemo(() => buildIndex(catalog.index), [catalog]);
  const [bodiesLoaded, setBodiesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const targets: { doc: SearchDoc; bodyId: string }[] = [
      ...catalog.index.plugins
        .filter((plugin) => plugin.bodyId)
        .map((plugin) => ({
          doc: {
            id: `plugin:${plugin.name}`,
            kind: 'plugin' as const,
            name: plugin.name,
            plugin: plugin.name,
            description: plugin.description,
            keywords: plugin.keywords.join(' '),
            body: '',
          },
          bodyId: plugin.bodyId as string,
        })),
      ...catalog.index.artifacts.map((artifact) => ({
        doc: {
          id: artifact.id,
          kind: artifact.kind,
          name: artifact.name,
          plugin: artifact.plugin,
          description: artifact.description,
          keywords: [...artifact.keywords, ...artifact.tools].join(' '),
          body: '',
        },
        bodyId: artifact.bodyId,
      })),
    ];

    Promise.all(
      targets.map(async ({ doc, bodyId }) => {
        try {
          const response = await fetch(asset(`bodies/${bodyId}.md`));
          if (!response.ok) return;
          const text = await response.text();
          if (!cancelled) addBody(search, doc, toPlainText(text));
        } catch {
          // A body that will not load simply is not searchable by its text.
          // Its name, keywords and description already are.
        }
      })
    ).then(() => {
      if (!cancelled) setBodiesLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [catalog, search]);

  return { search, bodiesLoaded };
}

export function SearchPage({ catalog, query }: { catalog: Catalog; query: string }) {
  const [value, setValue] = useState(query);
  const { search, bodiesLoaded } = useSearchIndex(catalog);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  // Follow a link into #/search?q=… without fighting the user's typing.
  useEffect(() => setValue(query), [query]);

  useEffect(() => {
    const id = window.setTimeout(() => replaceHash(href.search(value)), 200);
    return () => window.clearTimeout(id);
  }, [value]);

  const results = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return (search as MiniSearch<SearchDoc>).search(trimmed).slice(0, 50);
  }, [value, search, bodiesLoaded]);

  const trimmed = value.trim();

  return (
    <>
      <h1>{t('search.title')}</h1>

      <label className="search-label" htmlFor="q">
        {t('search.label')}
      </label>
      <input
        id="q"
        ref={input}
        className="search-input"
        type="search"
        value={value}
        placeholder={t('search.placeholder')}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <p className="note">{t('search.hint')}</p>

      <p role="status" aria-live="polite" className="note">
        {trimmed === ''
          ? t('search.start')
          : results.length === 1
            ? t('search.resultCountOne')
            : t('search.resultCount', { count: results.length })}
      </p>

      {trimmed !== '' && results.length === 0 ? (
        <>
          <p>{t('search.empty', { query: trimmed })}</p>
          <p className="note">{t('search.emptyHint')}</p>
        </>
      ) : null}

      <ul className="cards">
        {results.map((result) => {
          const id = String(result.id);
          const kind = result.kind as SearchDoc['kind'];
          const isPlugin = kind === 'plugin';
          const target = isPlugin ? href.plugin(String(result.plugin)) : href.artifact(id);

          return (
            <li key={id}>
              <a className="card" href={target}>
                <span className="card-title">
                  {String(result.name)}
                  <span className="kind">
                    {isPlugin ? t('search.kind.plugin') : t(`artifact.kind.${kind}`)}
                  </span>
                </span>
                <span className="card-body">{String(result.description)}</span>
                {!isPlugin ? (
                  <span className="card-meta">
                    {t('search.inPlugin', { plugin: String(result.plugin) })}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
