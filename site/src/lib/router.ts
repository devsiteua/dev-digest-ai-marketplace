import { useEffect, useState } from 'react';

/**
 * Hash routing, because GitHub Pages serves static files and has no rewrite
 * rule to send unknown paths to index.html (docs/SITE-SPEC.md § Stack).
 */
export type Route =
  | { name: 'home' }
  | { name: 'search'; query: string }
  | { name: 'plugin'; plugin: string }
  | { name: 'artifact'; id: string }
  | { name: 'whats-new' }
  | { name: 'getting-started' }
  | { name: 'not-found'; path: string };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const [path = '', queryString = ''] = raw.split('?');
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(queryString);

  if (segments.length === 0) return { name: 'home' };

  switch (segments[0]) {
    case 'search':
      return { name: 'search', query: query.get('q') ?? '' };
    case 'plugin':
      return segments[1]
        ? { name: 'plugin', plugin: segments[1] }
        : { name: 'not-found', path };
    case 'artifact':
      return segments[1]
        ? { name: 'artifact', id: segments.slice(1).join('/') }
        : { name: 'not-found', path };
    case 'whats-new':
      return { name: 'whats-new' };
    case 'getting-started':
      return { name: 'getting-started' };
    default:
      return { name: 'not-found', path };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      // A hash change is a navigation: start the new page at the top, the way a
      // real page load would.
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export const href = {
  home: () => '#/',
  search: (query?: string) =>
    query ? `#/search?q=${encodeURIComponent(query)}` : '#/search',
  plugin: (name: string) => `#/plugin/${encodeURIComponent(name)}`,
  artifact: (id: string) => `#/artifact/${encodeURIComponent(id)}`,
  whatsNew: () => '#/whats-new',
  gettingStarted: () => '#/getting-started',
};

/** Replace the hash without pushing a history entry — used by search-as-you-type. */
export function replaceHash(next: string): void {
  const url = `${window.location.pathname}${window.location.search}${next}`;
  window.history.replaceState(null, '', url);
}
