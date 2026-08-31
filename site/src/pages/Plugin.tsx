import { CommandBlock } from '../components/CopyButton';
import { Markdown } from '../components/Markdown';
import { t } from '../i18n';
import { useBody } from '../lib/data';
import { href } from '../lib/router';
import type { Catalog } from '../lib/types';

import { NotFound } from './NotFound';

/** 0.0.0 is the scaffold placeholder, not something a user can install. */
const isUnreleased = (version: string) => version === '0.0.0';

export function PluginPage({ catalog, name }: { catalog: Catalog; name: string }) {
  const plugin = catalog.index.plugins.find((candidate) => candidate.name === name);
  const body = useBody(plugin?.bodyId);

  if (!plugin) return <NotFound path={`/plugin/${name}`} />;

  const artifacts = plugin.artifacts
    .map((id) => catalog.index.artifacts.find((artifact) => artifact.id === id))
    .filter((artifact): artifact is NonNullable<typeof artifact> => Boolean(artifact));

  const transitive = (plugin.resolvedDependencies ?? []).filter(
    (dependency) => !plugin.dependencies.some((direct) => direct.name === dependency)
  );

  return (
    <>
      <h1>{plugin.name}</h1>
      <p className="lede">{plugin.description}</p>

      <dl className="facts">
        <div>
          <dt>{t('plugin.version')}</dt>
          <dd>
            {plugin.version}
            {isUnreleased(plugin.version) ? (
              <span className="badge">{t('plugin.unreleased')}</span>
            ) : null}
          </dd>
        </div>
        {plugin.author ? (
          <div>
            <dt>{t('plugin.author')}</dt>
            <dd>{plugin.author}</dd>
          </div>
        ) : null}
        {plugin.license ? (
          <div>
            <dt>{t('plugin.license')}</dt>
            <dd>{plugin.license}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t('plugin.compatibility')}</dt>
          <dd>{plugin.compatibility?.claudeCode ?? t('plugin.compatibilityUnknown')}</dd>
        </div>
      </dl>

      {isUnreleased(plugin.version) ? (
        <p className="warning">{t('plugin.unreleasedHint')}</p>
      ) : null}

      <h2>{t('plugin.install')}</h2>
      <CommandBlock
        command={`/plugin install ${plugin.name}@${catalog.index.marketplace.name}`}
        label={t('copy.action')}
      />

      <h2>{t('plugin.dependencies')}</h2>
      {plugin.dependencies.length === 0 ? (
        <p>{t('plugin.noDependencies')}</p>
      ) : (
        <ul className="plain">
          {plugin.dependencies.map((dependency) => (
            <li key={dependency.name}>
              <a href={href.plugin(dependency.name)}>{dependency.name}</a>{' '}
              <code>{dependency.version}</code>
            </li>
          ))}
        </ul>
      )}

      {transitive.length > 0 ? (
        <p className="note">
          {t('plugin.resolved')}:{' '}
          {transitive.map((dependency, i) => (
            <span key={dependency}>
              {i > 0 ? ', ' : ''}
              <a href={href.plugin(dependency)}>{dependency}</a>
            </span>
          ))}
        </p>
      ) : null}

      {plugin.dependents && plugin.dependents.length > 0 ? (
        <p className="note">
          {t('plugin.dependents')}:{' '}
          {plugin.dependents.map((dependent, i) => (
            <span key={dependent}>
              {i > 0 ? ', ' : ''}
              <a href={href.plugin(dependent)}>{dependent}</a>
            </span>
          ))}
        </p>
      ) : null}

      <h2>{t('plugin.contents')}</h2>
      {artifacts.length === 0 ? (
        <p>{t('plugin.noContents')}</p>
      ) : (
        <ul className="cards">
          {artifacts.map((artifact) => (
            <li key={artifact.id}>
              <a className="card" href={href.artifact(artifact.id)}>
                <span className="card-title">
                  {artifact.name}
                  <span className="kind">{t(`artifact.kind.${artifact.kind}`)}</span>
                </span>
                <span className="card-body">{artifact.description}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <h2>{t('plugin.readme')}</h2>
      {body.state === 'loading' ? <p className="note">{t('common.loading')}</p> : null}
      {body.state === 'error' ? <p className="note">{t('plugin.noReadme')}</p> : null}
      {body.state === 'ready' && body.data ? (
        <Markdown source={body.data} stripTitle />
      ) : null}
      {body.state === 'ready' && !body.data ? (
        <p className="note">{t('plugin.noReadme')}</p>
      ) : null}
    </>
  );
}
