import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Markdown → sanitized HTML.
 *
 * **There is no code path that sets innerHTML from Markdown without passing
 * through DOMPurify first** (docs/SITE-SPEC.md § Markdown rendering). The
 * catalog renders content from a repository that accepts pull requests;
 * repository content is not trusted HTML.
 *
 * Sanitizing is done here rather than at the call site on purpose: a component
 * cannot render a body without going through this function, so the guarantee
 * holds by construction instead of by remembering.
 */
marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false });

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // Anything that executes, loads, or frames is dropped rather than escaped.
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'srcset', 'formaction'],
  });
}

/**
 * Drop a document's leading `# Title` — the page already shows the name in its
 * own heading, and two of them read as a bug.
 */
export function withoutLeadingHeading(source: string): string {
  return source.replace(/^\s*#\s+.*\r?\n+/, '');
}

/** Plain text for the search index: no markup, no link syntax, collapsed space. */
export function toPlainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[>\-*+#|]+/gm, ' ')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
