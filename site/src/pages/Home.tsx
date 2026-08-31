import { CommandBlock } from '../components/CopyButton';
import { t } from '../i18n';
import { href } from '../lib/router';
import type { Catalog } from '../lib/types';

const MARKETPLACE_ADD =
  'claude plugin marketplace add devsiteua/dev-digest-ai-marketplace';

export function Home({ catalog }: { catalog: Catalog }) {
  const { index, stats } = catalog;

  return (
    <>
      <h1>{index.marketplace.name}</h1>
      <p className="lede">{index.marketplace.description || t('home.tagline')}</p>

      <h2>{t('home.addMarketplace')}</h2>
      <CommandBlock command={MARKETPLACE_ADD} />

      <ul className="stats">
        <li>
          <strong>{stats.plugins}</strong> {t('home.stats.plugins')}
        </li>
        <li>
          <strong>{stats.artifactsByKind.agent ?? 0}</strong> {t('home.stats.agents')}
        </li>
        <li>
          <strong>{stats.artifactsByKind.skill ?? 0}</strong> {t('home.stats.skills')}
        </li>
      </ul>

      <p className="note">
        {/* Never a fabricated date: with nothing released, say so. */}
        {stats.latestRelease
          ? `${t('home.stats.latestRelease')}: ${stats.latestRelease}`
          : `${t('home.stats.noRelease')} — ${t('home.stats.noReleaseHint')}`}
      </p>

      <h2>{t('home.plugins')}</h2>
      <ul className="cards">
        {index.plugins.map((plugin) => (
          <li key={plugin.name}>
            <a className="card" href={href.plugin(plugin.name)}>
              <span className="card-title">
                {plugin.name}
                <span className="version">{plugin.version}</span>
              </span>
              <span className="card-body">{plugin.description}</span>
              <span className="card-meta">
                {plugin.artifacts.length > 0
                  ? plugin.artifacts.map((id) => id.split(':')[1]).join(' · ')
                  : t('plugin.noContents')}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
