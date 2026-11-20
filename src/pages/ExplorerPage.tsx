import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Explorer } from '../components/explorer/Explorer';
import { useExplorer } from '../store/explorerStore';

export function ExplorerPage() {
  const [params] = useSearchParams();
  const selectBuilding = useExplorer((s) => s.selectBuilding);

  useEffect(() => {
    const b = params.get('b');
    if (b) selectBuilding(b);
    // read once on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="pt-[var(--header-h)]" aria-label="3D structure explorer">
      <h1 className="sr-only">3D structure explorer</h1>
      <Explorer className="border-t border-white/[0.08] lg:h-[calc(100svh-var(--header-h))]" />
    </section>
  );
}
