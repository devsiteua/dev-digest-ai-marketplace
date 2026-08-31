import { useEffect, useRef, useState } from 'react';

import { t } from '../i18n';

/**
 * A copy button that announces the outcome (docs/SITE-SPEC.md § Accessibility):
 * the result goes into a live region, so it is not only a colour change that a
 * screen-reader user never hears.
 */
export function CopyButton({
  value,
  label = t('copy.command'),
}: {
  value: string;
  label?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      // A denied clipboard permission or an insecure context. Say so rather
      // than showing a success the user did not get.
      setStatus('failed');
    }
    timer.current = window.setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <>
      <button type="button" className="copy" onClick={copy} data-status={status}>
        {status === 'copied' ? t('copy.done') : label}
      </button>
      <span role="status" aria-live="polite" className="visually-hidden">
        {status === 'copied' ? t('copy.done') : status === 'failed' ? t('copy.failed') : ''}
      </span>
      {status === 'failed' ? <span className="copy-failed">{t('copy.failed')}</span> : null}
    </>
  );
}

/** A command line with its own copy button. */
export function CommandBlock({ command, label }: { command: string; label?: string }) {
  return (
    <div className="command">
      <pre>
        <code>{command}</code>
      </pre>
      <CopyButton value={command} label={label} />
    </div>
  );
}
