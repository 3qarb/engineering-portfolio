import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Box, Layers, Upload } from 'lucide-react';
import { CATEGORY_LABEL, CATEGORY_ORDER, elementTypes, type ElementType } from '../data/elements';
import { villa } from '../data/models/villa';
import { SectionDrawing } from '../components/explorer/SectionDrawing';
import { FadeUp, LineReveal } from '../components/ui/Motion';
import { Seo } from '../components/Seo';
import { hasWebGL } from '../lib/device';
import { isOwner } from '../lib/owner';
import { sectionFacts } from '../lib/structure/sectionMath';
import { useLang, useLocalePath } from '../i18n';
import { useTools } from '../i18n/tools';
import { cn } from '../utils/cn';

const ElementViewer = lazy(() => import('../components/elements/ElementViewer'));

class ViewerBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Members of each library type in the villa model, for the "used in" line. */
const villaCounts = (() => {
  const m = new Map<string, number>();
  for (const e of villa.imported?.elements ?? []) if (e.typeId) m.set(e.typeId, (m.get(e.typeId) ?? 0) + 1);
  return m;
})();

function Detail({ item }: { item: ElementType }) {
  const t = useTools().elements;
  const lang = useLang();
  const lp = useLocalePath();
  const [view, setView] = useState<'3d' | 'section'>('3d');
  const [rebar, setRebar] = useState(true);
  const webgl = useMemo(() => hasWebGL(), []);
  const used = villaCounts.get(item.id) ?? 0;
  const tx = (v: { en: string; ar: string }) => v[lang];

  return (
    <article aria-labelledby="el-title" className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="el-title" className="display h-md">
          {tx(item.name)}
        </h2>
        <p className="label text-bone-mute">{tx(CATEGORY_LABEL[item.category])}</p>
      </div>

      <div className="mt-6 overflow-hidden border border-white/[0.08] bg-ink-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2.5">
          <div className="flex gap-1" role="tablist" aria-label={tx(item.name)}>
            {(['3d', 'section'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn('label inline-flex min-h-[40px] items-center gap-1.5 rounded-sm px-3', view === v ? 'bg-bone text-ink-950' : 'text-bone-dim hover:text-bone')}
              >
                {v === '3d' ? <Box className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />} {v === '3d' ? t.view3d : t.section}
              </button>
            ))}
          </div>
          {view === '3d' && (
            <label className="label flex min-h-[40px] cursor-pointer items-center gap-2 text-bone-dim">
              <input type="checkbox" checked={rebar} onChange={(e) => setRebar(e.target.checked)} className="h-4 w-4 accent-[#c9a46c]" />
              {t.rebar}
            </label>
          )}
        </div>
        <div className={cn('relative', view === '3d' ? 'h-[340px] sm:h-[460px]' : 'grid-paper h-[340px] p-6 sm:h-[460px] sm:p-10')}>
          {view === '3d' ? (
            webgl ? (
              <ViewerBoundary fallback={<p className="grid h-full place-items-center p-8 text-center text-bone-dim">{t.noWebgl}</p>}>
                <Suspense fallback={<span className="label grid h-full animate-pulse place-items-center">…</span>}>
                  <ElementViewer el={item.sample} rebar={rebar} />
                </Suspense>
              </ViewerBoundary>
            ) : (
              <p className="grid h-full place-items-center p-8 text-center text-bone-dim">{t.noWebgl}</p>
            )
          ) : (
            <SectionDrawing section={item.sample.section} />
          )}
          <p className="label pointer-events-none absolute bottom-3 start-4 text-bone-mute">{view === '3d' ? t.drag : t.typical}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="label mb-3 text-sand">{t.what}</h3>
            <p className="lede max-w-[62ch]">{tx(item.summary)}</p>
          </section>
          <section>
            <h3 className="label mb-3 text-sand">{t.use}</h3>
            <p className="max-w-[62ch] text-[16px] leading-relaxed text-bone-dim">{tx(item.use)}</p>
          </section>
          <section>
            <h3 className="label mb-3 text-sand">{t.checks}</h3>
            <ul className="flex flex-col">
              {item.checks.map((c) => (
                <li key={c.clause + c.text.en.slice(0, 12)} className="grid gap-1 border-b border-white/[0.07] py-4 last:border-b-0 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
                  <p className="font-mono text-[12px] leading-snug text-bone" dir="ltr">
                    {c.clause}
                    {c.basis === 'guidance' && <span className="ms-2 border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-bone-mute">{t.guidance}</span>}
                  </p>
                  <p className="text-[15px] leading-snug text-bone-dim">{tx(c.text)}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="label mb-3 text-sand">{t.takeoff}</h3>
            <p className="max-w-[62ch] text-[15px] leading-relaxed text-bone-dim">{tx(item.takeoff)}</p>
          </section>
          <section>
            <h3 className="label mb-3 text-sand">{t.model}</h3>
            <p className="max-w-[62ch] text-[15px] leading-relaxed text-bone-dim">{tx(item.recognise)}</p>
          </section>
        </div>
        <aside>
          <h3 className="label mb-3">{t.typical}</h3>
          <dl dir="ltr">
            {sectionFacts(item.sample.section).map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-2.5">
                <dt className="label">{f.label}</dt>
                <dd className="text-end font-mono text-[13px] text-bone">{f.value}</dd>
              </div>
            ))}
          </dl>
          {used > 0 && (
            <Link to={lp(`/explorer?b=villa`)} className="mt-6 flex items-center justify-between gap-3 border border-white/[0.08] p-4 text-[14px] text-bone-dim transition-colors hover:border-sand hover:text-bone">
              <span>
                <span className="label block text-sand">{t.usedIn}</span>
                {t.members(used)}
              </span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          )}
        </aside>
      </div>
    </article>
  );
}

export function Elements() {
  const [owner] = useState(isOwner);
  const tools = useTools();
  const t = tools.elements;
  const lang = useLang();
  const lp = useLocalePath();
  const [params, setParams] = useSearchParams();
  const current = elementTypes.find((e) => e.id === params.get('e')) ?? elementTypes.find((e) => e.id === 'ribbed-slab')!;
  const pick = (id: string) => setParams({ e: id }, { replace: true, preventScrollReset: true });

  return (
    <>
      <Seo title={tools.seo.elements.title} description={tools.seo.elements.description} />
      <section className="wrap pb-12 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">
          <span className="text-sand">{elementTypes.length}</span> / {t.label}
        </p>
        <h1 className="sr-only">{t.label}</h1>
        <LineReveal lines={[t.lineA, <span key="2" className="text-bone-mute">{t.lineB}</span>]} className="display h-xl" />
        <FadeUp delay={0.25} className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="lede max-w-[62ch]">{t.intro}</p>
          {owner && (
            <Link to={lp('/projects/import')} className="btn-ghost shrink-0">
              <Upload className="h-4 w-4" /> {t.addProject}
            </Link>
          )}
        </FadeUp>
      </section>

      <section className="wrap pb-24" aria-label={t.label}>
        <div className="grid gap-10 border-t border-white/[0.08] pt-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <nav aria-label={t.label} className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="mb-5">
                <p className="label mb-2 text-bone-mute">{CATEGORY_LABEL[cat][lang]}</p>
                <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
                  {elementTypes
                    .filter((e) => e.category === cat)
                    .map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => pick(e.id)}
                          aria-current={e.id === current.id ? 'true' : undefined}
                          className={cn(
                            'min-h-[40px] w-full rounded-sm border px-3 py-2 text-start text-[14px] transition-colors lg:rounded-none lg:border-0 lg:border-s-2 lg:px-3',
                            e.id === current.id ? 'border-sand bg-white/[0.04] text-bone' : 'border-white/10 text-bone-dim hover:text-bone lg:border-transparent',
                          )}
                        >
                          {e.name[lang]}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
          <Detail key={current.id} item={current} />
        </div>
      </section>
    </>
  );
}
