import { t } from '../i18n';
import { href } from '../lib/router';

export function NotFound({ path }: { path: string }) {
  return (
    <>
      <h1>{t('common.notFound')}</h1>
      <p>{t('common.notFoundBody', { path })}</p>
      <p>
        <a href={href.home()}>{t('common.backHome')}</a>
      </p>
    </>
  );
}
