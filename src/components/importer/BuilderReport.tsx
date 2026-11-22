import { lazy, Suspense, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { elementType, elementTypes } from '../../data/elements';
import type { BuildingSpec } from '../../lib/structure/types';
import { byType, DEFAULT_RATES, takeoffCsv, totals, type Rates, type TakeoffRow } from '../../lib/import/takeoff';
import { hasWebGL } from '../../lib/device';
import { useLang } from '../../i18n';
import { useTools } from '../../i18n/tools';
import { cn } from '../../utils/cn';

const ModelPreview = lazy(() => import('../three/ModelPreview'));
const ORDER = elementTypes.map((e) => e.id);
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 1 });
const f0 = (v: number) => Math.round(v).toLocaleString('en-US');

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Table({ rows, rates, label, first }: { rows: TakeoffRow[]; rates: Rates; label: (r: TakeoffRow) => string; first: string }) {
  const t = useTools().importer.builder;
  const sum = totals(rows, rates);
  const th = 'label py-2.5 pe-4 text-end font-normal';
  const td = 'py-2.5 pe-4 text-end font-mono text-[13px] text-bone';
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[14px]">
        <thead>
          <tr className="border-b border-white/15">
            <th className="label py-2.5 pe-4 text-start font-normal">{first}</th>
            <th className={th}>{t.count}</th>
            <th className={th}>{t.concrete}</th>
            <th className={th}>{t.formwork}</th>
            <th className={th}>{t.steel}</th>
            <th className={th}>{t.atRates}</th>
            <th className={th}>{t.blocks}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.typeId + r.story} className="border-b border-white/[0.07]">
              <td className="py-2.5 pe-4 text-bone-dim">{label(r)}</td>
              <td className={td}>{r.count}</td>
              <td className={td}>{f1(r.concrete)}</td>
              <td className={td}>{f0(r.formwork)}</td>
              <td className={td}>{f0(r.steel)}</td>
              <td className={td}>{f0(r.concrete * (rates[r.typeId] ?? 0))}</td>
              <td className={td}>{r.blocks ? f0(r.blocks) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="label py-3 pe-4 text-bone">{t.total}</td>
            <td />
            <td className={td}>{f1(sum.concrete)}</td>
            <td className={td}>{f0(sum.formwork)}</td>
            <td className={td}>{t.tonnes(sum.steel / 1000)}</td>
            <td className={td}>{t.tonnes(sum.steelAtRates / 1000)}</td>
            <td className={td}>{sum.blocks ? f0(sum.blocks) : '—'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Agent 3: the 3D model and the quantity take-off. */
export function BuilderReport({ spec, rows, title, exploreHref }: { spec: BuildingSpec; rows: TakeoffRow[]; title: string; exploreHref?: string }) {
  const tools = useTools();
  const t = tools.importer.builder;
  const noWebgl = tools.elements.noWebgl;
  const lang = useLang();
  const [view, setView] = useState<'type' | 'story'>('type');
  const [rates, setRates] = useState<Rates>({ ...DEFAULT_RATES });
  const webgl = useMemo(() => hasWebGL(), []);
  const types = useMemo(() => byType(rows, ORDER), [rows]);
  const stories = useMemo(() => [...rows].sort((a, b) => a.story.localeCompare(b.story) || ORDER.indexOf(a.typeId) - ORDER.indexOf(b.typeId)), [rows]);
  const name = (id: string) => elementType(id)?.name[lang] ?? id;
  const used = types.map((r) => r.typeId);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="label text-sand">{t.preview}</h3>
          {exploreHref && (
            <a href={exploreHref} className="label min-h-[40px] content-center text-bone-dim hover:text-bone">
              {t.open3d} →
            </a>
          )}
        </div>
        <div className="h-[360px] overflow-hidden border border-white/[0.08] bg-ink-900 sm:h-[480px]">
          {webgl ? (
            <Suspense fallback={<span className="label grid h-full animate-pulse place-items-center">…</span>}>
              <ModelPreview spec={spec} />
            </Suspense>
          ) : (
            <p className="grid h-full place-items-center p-8 text-center text-bone-dim">{noWebgl}</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="label text-sand">{t.takeoff}</h3>
          <div className="flex flex-wrap gap-2">
            {(['type', 'story'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn('label min-h-[40px] rounded-sm px-3', view === v ? 'bg-bone text-ink-950' : 'text-bone-dim hover:text-bone')}
              >
                {v === 'type' ? t.byType : t.byStory}
              </button>
            ))}
            <button type="button" className="btn-ghost" onClick={() => download(`takeoff-${title.replace(/[^\w-]+/g, '-').toLowerCase()}.csv`, takeoffCsv(title, stories, name, rates))}>
              <Download className="h-4 w-4" /> {t.csv}
            </button>
          </div>
        </div>
        {view === 'type' ? (
          <Table rows={types} rates={rates} first={t.element} label={(r) => name(r.typeId)} />
        ) : (
          <Table rows={stories} rates={rates} first={`${t.story} · ${t.element}`} label={(r) => `${r.story} · ${name(r.typeId)}`} />
        )}
      </section>

      <section>
        <h3 className="label mb-2 text-sand">{t.rates}</h3>
        <p className="mb-4 max-w-[66ch] text-[14px] text-bone-dim">{t.ratesNote}</p>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {used.map((id) => (
            <label key={id} className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-2 text-[14px] text-bone-dim">
              {name(id)}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={600}
                step={5}
                value={rates[id] ?? 0}
                onChange={(e) => setRates((r) => ({ ...r, [id]: Math.min(600, Math.max(0, Number(e.target.value) || 0)) }))}
                className="w-20 border border-white/15 bg-transparent px-2 py-1.5 text-end font-mono text-[14px] text-bone focus:border-sand focus:outline-none"
                dir="ltr"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
