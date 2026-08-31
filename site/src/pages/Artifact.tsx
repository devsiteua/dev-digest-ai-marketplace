import { Markdown } from '../components/Markdown';
import { CopyButton } from '../components/CopyButton';
import { t } from '../i18n';
import { useBody } from '../lib/data';
import { href } from '../lib/router';
import type { Catalog } from '../lib/types';

import { NotFound } from './NotFound';

export function ArtifactPage({ catalog, id }: { catalog: Catalog; id: string }) {
  const artifact = catalog.index.artifacts.find((candidate) => candidate.id === id);
  const body = useBody(artifact?.bodyId);

  if (!artifact) return <NotFound path={`/artifact/${id}`} />;

  return (
    <>
      <p className="crumbs">
        <a href={href.plugin(artifact.plugin)}>{artifact.plugin}</a>
      </p>

      <h1>
        {artifact.name} <span className="kind">{t(`artifact.kind.${artifact.kind}`)}</span>
      </h1>
      <p className="lede">{artifact.description}</p>

      <h2>{t('artifact.reference')}</h2>
      <div className="command">
        <pre>
          <code>{artifact.id}</code>
        </pre>
        <CopyButton value={artifact.id} />
      </div>
      <p className="note">{t('artifact.referenceHint')}</p>

      <dl className="facts">
        <div>
          <dt>{t('artifact.fromPlugin')}</dt>
          <dd>
            <a href={href.plugin(artifact.plugin)}>{artifact.plugin}</a>
          </dd>
        </div>
        {artifact.model ? (
          <div>
            <dt>{t('artifact.model')}</dt>
            <dd>{artifact.model}</dd>
          </div>
        ) : null}
      </dl>

      <h2>{t('artifact.tools')}</h2>
      {artifact.tools.length === 0 ? (
        <p className="note">{t('artifact.noTools')}</p>
      ) : (
        <ul className="tags">
          {artifact.tools.map((tool) => (
            <li key={tool}>
              <code>{tool}</code>
            </li>
          ))}
        </ul>
      )}

      <h2>{t('artifact.source')}</h2>
      {body.state === 'loading' ? <p className="note">{t('common.loading')}</p> : null}
      {body.state === 'error' ? <p className="note">{body.error}</p> : null}
      {body.state === 'ready' && body.data ? <Markdown source={body.data} /> : null}
    </>
  );
}
