import { Layout } from './components/Layout';
import { t } from './i18n';
import { useCatalog } from './lib/data';
import { useRoute } from './lib/router';
import { ArtifactPage } from './pages/Artifact';
import { GettingStarted } from './pages/GettingStarted';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { PluginPage } from './pages/Plugin';
import { SearchPage } from './pages/Search';
import { WhatsNew } from './pages/WhatsNew';

export function App() {
  const route = useRoute();
  const catalog = useCatalog();

  // Getting started is pure copy, so it works even when the index is missing.
  if (route.name === 'getting-started') {
    return (
      <Layout>
        <GettingStarted />
      </Layout>
    );
  }

  if (catalog.state === 'loading') {
    return (
      <Layout>
        <p className="note">{t('common.loading')}</p>
      </Layout>
    );
  }

  if (catalog.state === 'error') {
    return (
      <Layout>
        <h1>{t('common.loadError')}</h1>
        <p className="note">{t('common.loadErrorHint')}</p>
        <p className="note">
          <code>{catalog.error}</code>
        </p>
      </Layout>
    );
  }

  const { data } = catalog;

  return (
    <Layout generatedAt={data.index.generatedAt}>
      {route.name === 'home' ? <Home catalog={data} /> : null}
      {route.name === 'search' ? <SearchPage catalog={data} query={route.query} /> : null}
      {route.name === 'plugin' ? <PluginPage catalog={data} name={route.plugin} /> : null}
      {route.name === 'artifact' ? <ArtifactPage catalog={data} id={route.id} /> : null}
      {route.name === 'whats-new' ? <WhatsNew releases={data.releases} /> : null}
      {route.name === 'not-found' ? <NotFound path={route.path} /> : null}
    </Layout>
  );
}
