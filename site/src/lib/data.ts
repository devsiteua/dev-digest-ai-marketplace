import { useEffect, useState } from 'react';

import type { Catalog, Index, Releases, Stats } from './types';

/**
 * Resolve a generated file against the document base.
 *
 * Vite is configured with `base: './'` because Pages serves this repository
 * under a sub-path. Hash routing leaves the path untouched, so resolving
 * against `document.baseURI` gives the right URL at the root and under a
 * sub-path alike — without hardcoding either.
 */
const asset = (file: string) => new URL(file, document.baseURI).href;

async function getJson<T>(file: string): Promise<T> {
  const response = await fetch(asset(file), { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${file}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export type Load<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'error'; error: string };

/**
 * The whole catalog, minus the bodies. Small enough for one load on first
 * paint, which is the reason bodies live in their own files.
 */
export function useCatalog(): Load<Catalog> {
  const [result, setResult] = useState<Load<Catalog>>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getJson<Index>('index.json'),
      getJson<Releases>('releases.json'),
      getJson<Stats>('stats.json'),
    ])
      .then(([index, releases, stats]) => {
        if (!cancelled) setResult({ state: 'ready', data: { index, releases, stats } });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            state: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}

const bodyCache = new Map<string, string>();

/** A rendered-on-demand Markdown body. Absent is a state, not an error. */
export function useBody(bodyId: string | null | undefined): Load<string | null> {
  const [result, setResult] = useState<Load<string | null>>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;

    if (!bodyId) {
      setResult({ state: 'ready', data: null });
      return;
    }

    const cached = bodyCache.get(bodyId);
    if (cached !== undefined) {
      setResult({ state: 'ready', data: cached });
      return;
    }

    setResult({ state: 'loading' });

    fetch(asset(`bodies/${bodyId}.md`))
      .then(async (response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.text();
      })
      .then((text) => {
        bodyCache.set(bodyId, text);
        if (!cancelled) setResult({ state: 'ready', data: text });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            state: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bodyId]);

  return result;
}
