import { useEffect, useState, type ReactNode } from 'react';

import { t } from '../i18n';
import { href } from '../lib/router';

type Theme = 'system' | 'dark' | 'light';

const STORAGE_KEY = 'ddm-theme';

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  } catch {
    // A private window or blocked site data. The default is still correct.
  }
  return 'system';
}

/** Dark-first, with a light theme available and the system setting respected. */
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Not persisting a preference is a smaller failure than not applying it.
    }
  }, [theme]);

  const next: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };
  const label: Record<Theme, string> = {
    system: t('theme.system'),
    dark: t('theme.dark'),
    light: t('theme.light'),
  };

  return (
    <button
      type="button"
      className="theme"
      onClick={() => setTheme(next[theme])}
      aria-label={`${t('theme.toggle')} — ${label[theme]}`}
    >
      {label[theme]}
    </button>
  );
}

const REPOSITORY = 'https://github.com/devsiteua/dev-digest-ai-marketplace';

export function Layout({ children, generatedAt }: { children: ReactNode; generatedAt?: string }) {
  return (
    <>
      <a className="skip" href="#main">
        {t('nav.skipToContent')}
      </a>

      <header className="site-header">
        <a className="brand" href={href.home()}>
          {t('nav.brand')}
        </a>
        <nav aria-label={t('nav.brand')}>
          <a href={href.search()}>{t('nav.search')}</a>
          <a href={href.whatsNew()}>{t('nav.whatsNew')}</a>
          <a href={href.gettingStarted()}>{t('nav.gettingStarted')}</a>
          <a href={REPOSITORY} rel="noreferrer noopener">
            {t('nav.repository')}
          </a>
          <ThemeToggle />
        </nav>
      </header>

      <main id="main" className="shell" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        {generatedAt ? (
          <p>{t('common.generatedAt', { date: new Date(generatedAt).toISOString().slice(0, 10) })}</p>
        ) : null}
      </footer>
    </>
  );
}
