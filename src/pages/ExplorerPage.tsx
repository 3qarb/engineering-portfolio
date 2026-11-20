import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Explorer } from '../components/explorer/Explorer';
import { useExplorer } from '../store/explorerStore';
import { Seo } from '../components/Seo';
import { useT } from '../i18n';

export function ExplorerPage() {
  const [params] = useSearchParams();
  const selectBuilding = useExplorer((s) => s.selectBuilding);
  const t = useT();

  useEffect(() => {
    const b = params.get('b');
    if (b) selectBuilding(b);
    // read once on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="pt-[var(--header-h)]" aria-labelledby="explorer-title">
      <Seo title={t.seo.explorer.title} description={t.seo.explorer.description} />
      <h1 id="explorer-title" className="sr-only">
        {t.nav.explorer}
      </h1>
      <Explorer className="border-t border-white/[0.08] lg:h-[calc(100svh-var(--header-h))]" />
    </section>
  );
}
