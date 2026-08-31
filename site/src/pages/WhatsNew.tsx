import { t } from '../i18n';
import { href } from '../lib/router';
import type { Releases } from '../lib/types';

export function WhatsNew({ releases }: { releases: Releases }) {
  if (releases.releases.length === 0) {
    return (
      <>
        <h1>{t('whatsNew.title')}</h1>
        <p>{t('whatsNew.empty')}</p>
        <p className="note">{t('whatsNew.emptyHint')}</p>
      </>
    );
  }

  return (
    <>
      <h1>{t('whatsNew.title')}</h1>
      {releases.releases.map((release) => (
        <article key={release.tag} className="release">
          <h2>
            <a href={href.plugin(release.plugin)}>{release.plugin}</a>{' '}
            <span className="version">{release.version}</span>
          </h2>
          <p className="note">
            {release.date ?? t('whatsNew.undated')} · {t('whatsNew.tag')}{' '}
            <code>{release.tag}</code>
          </p>
          {Object.entries(release.sections).map(([section, entries]) => (
            <section key={section}>
              <h3>{section}</h3>
              <ul>
                {entries.map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ul>
            </section>
          ))}
        </article>
      ))}
    </>
  );
}
