import { quantities } from './sectionMath';
import { KIND_LABEL, type StructuralElement } from './types';

export interface ScheduleRow {
  type: string;
  mark: string;
  count: number;
  length: number;
  concrete: number;
  steel: number;
}

function mark(el: StructuralElement): string {
  const s = el.section;
  switch (s.kind) {
    case 'rc-column':
      return `${s.b}×${s.h} ${s.bars.n}T${s.bars.dia}`;
    case 'rc-beam':
      return `${s.b}×${s.h} ${s.bottom.n}T${s.bottom.dia}B`;
    case 'rc-slab':
      return `t${s.t} T${s.bottom.dia}@${s.bottom.spacing}`;
    case 'rc-footing':
      return `${s.l}×${s.b}×${s.t}`;
    case 'ribbed-slab':
      return `t${s.depth} ribs ${s.ribWidth}@${s.ribSpacing}`;
    case 'masonry-wall':
      return `${s.t} stone`;
    case 'timber-beam':
      return `${s.b}×${s.h} timber`;
    case 'layered':
      return `${s.layers.reduce((a, l) => a + l.t, 0)} build-up`;
    case 'steel-tube':
      return `Ø${s.od}×${s.t}`;
  }
}

/** Revit-style quantity schedule: one row per member type and size. */
export function buildSchedule(elements: StructuralElement[]): { rows: ScheduleRow[]; total: ScheduleRow } {
  const map = new Map<string, ScheduleRow>();
  for (const el of elements) {
    const type = el.section.kind === 'timber-beam' ? 'Timber beam' : KIND_LABEL[el.kind];
    const m = mark(el);
    const key = `${type}|${m}`;
    const row = map.get(key) ?? { type, mark: m, count: 0, length: 0, concrete: 0, steel: 0 };
    const q = quantities(el);
    row.count += 1;
    row.length += el.length;
    row.concrete += q.concrete ?? 0;
    row.steel += q.steel ?? 0;
    map.set(key, row);
  }
  const rows = [...map.values()].sort((a, b) => a.type.localeCompare(b.type) || b.count - a.count);
  const total = rows.reduce(
    (t, r) => ({ ...t, count: t.count + r.count, length: t.length + r.length, concrete: t.concrete + r.concrete, steel: t.steel + r.steel }),
    { type: 'Total', mark: '', count: 0, length: 0, concrete: 0, steel: 0 },
  );
  return { rows, total };
}

export function scheduleCsv(name: string, rows: ScheduleRow[], total: ScheduleRow): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const line = (r: ScheduleRow) =>
    [r.type, r.mark, r.count, r.length.toFixed(2), r.concrete.toFixed(2), r.steel.toFixed(0)].map(esc).join(',');
  return [
    esc(`Quantity schedule — ${name}`),
    ['Type', 'Mark', 'Count', 'Length (m)', 'Concrete (m3)', 'Rebar (kg)'].map(esc).join(','),
    ...rows.map(line),
    line(total),
  ].join('\r\n');
}

export function download(filename: string, content: string | Blob, type = 'text/csv') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
