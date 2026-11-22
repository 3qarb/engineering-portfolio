import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { elementsFor } from '../../lib/structure/generate';
import { buildSchedule, download, scheduleCsv } from '../../lib/structure/schedule';
import { fmt } from '../../lib/structure/sectionMath';
import type { BuildingSpec } from '../../lib/structure/types';

/** Revit-style quantity schedule for one building, with CSV export. */
export function Schedule({ spec }: { spec: BuildingSpec }) {
  const { rows, total } = useMemo(() => buildSchedule(elementsFor(spec)), [spec]);
  const hasConcrete = total.concrete > 0;

  return (
    <section aria-labelledby="sched">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p id="sched" className="label">
          Quantity schedule
        </p>
        <button
          type="button"
          onClick={() => download(`${spec.id}-schedule.csv`, scheduleCsv(spec.name, rows, total))}
          className="label inline-flex min-h-[36px] items-center gap-1.5 hover:text-sand"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full min-w-[340px] border-collapse font-mono text-[11.5px]">
          <thead>
            <tr className="bg-white/[0.03] text-left text-bone-mute">
              <th className="px-3 py-2 font-normal">Type · mark</th>
              <th className="px-2 py-2 text-right font-normal">No.</th>
              {hasConcrete && <th className="px-2 py-2 text-right font-normal">m³</th>}
              {hasConcrete && <th className="px-2 py-2 text-right font-normal" title="Formwork">m²</th>}
              {hasConcrete && <th className="px-3 py-2 text-right font-normal">kg</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.type}${r.mark}`} className="border-t border-white/[0.06] text-bone-dim">
                <td className="px-3 py-2">
                  <span className="text-bone">{r.type}</span> <span className="text-bone-mute">{r.mark}</span>
                </td>
                <td className="px-2 py-2 text-right">{r.count}</td>
                {hasConcrete && <td className="px-2 py-2 text-right">{r.concrete ? fmt(r.concrete, 1) : '—'}</td>}
                {hasConcrete && <td className="px-2 py-2 text-right">{r.formwork ? fmt(r.formwork) : '—'}</td>}
                {hasConcrete && <td className="px-3 py-2 text-right">{r.steel ? fmt(r.steel) : '—'}</td>}
              </tr>
            ))}
            <tr className="border-t border-white/20 text-bone">
              <td className="px-3 py-2">Total</td>
              <td className="px-2 py-2 text-right">{total.count}</td>
              {hasConcrete && <td className="px-2 py-2 text-right">{fmt(total.concrete, 1)}</td>}
              {hasConcrete && <td className="px-2 py-2 text-right">{fmt(total.formwork)}</td>}
              {hasConcrete && <td className="px-3 py-2 text-right">{fmt(total.steel / 1000, 1)} t</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
