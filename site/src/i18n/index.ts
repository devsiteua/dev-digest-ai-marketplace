import { en, type CopyKey } from './en';

/**
 * Add a language by adding a file beside `en.ts` and listing it here. No
 * component changes (docs/SITE-SPEC.md § Internationalization).
 */
const locales = { en } as const;

export type Locale = keyof typeof locales;

const active: Locale = 'en';

/**
 * Look up a string, substituting `{name}` placeholders.
 *
 * A missing key returns the key itself. That is deliberate: a visible
 * `plugin.installl` in the UI is a bug someone reports, where a silent empty
 * string is a bug nobody sees.
 */
export function t(key: CopyKey, values?: Record<string, string | number>): string {
  const copy = locales[active][key] as string | undefined;
  if (copy === undefined) return key;
  if (!values) return copy;

  return copy.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  );
}

export type { CopyKey };
