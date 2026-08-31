import { useMemo } from 'react';

import { renderMarkdown, withoutLeadingHeading } from '../lib/markdown';

/**
 * The only component that sets HTML from Markdown, and it cannot do so without
 * `renderMarkdown`, which sanitizes. Keeping that in one place is what makes
 * "no Markdown reaches the DOM unsanitized" a property of the code rather than
 * a rule someone has to remember.
 */
export function Markdown({ source, stripTitle = false }: { source: string; stripTitle?: boolean }) {
  const html = useMemo(
    () => renderMarkdown(stripTitle ? withoutLeadingHeading(source) : source),
    [source, stripTitle]
  );

  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
