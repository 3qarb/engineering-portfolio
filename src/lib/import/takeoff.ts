// Agent 3 — Builder (quantities): concrete, formwork, reinforcement and blocks by element type and story.
import { ribCentres } from '../structure/rebar';
import { quantities } from '../structure/sectionMath';
import type { StructuralElement } from '../structure/types';

export interface TakeoffRow {
  typeId: string;
  story: string;
  count: number;
  /** Total member length (beams, columns, walls), m */
  length: number;
  /** Plan or face area (slabs, walls, footings), m² */
  area: number;
  concrete: number;
  formwork: number;
  /** From the member detailing (model bars, drawings or ACI minimum) */
  steel: number;
  /** Hollow blocks, ribbed slabs only */
  blocks: number;
}

/** kg of reinforcement per m³ of concrete, by element type: the owner's estimating rates. */
export type Rates = Record<string, number>;

/** Starting rates for a preliminary estimate. Editable on the page; they are not code values. */
export const DEFAULT_RATES: Rates = {
  'solid-slab': 90,
  'flat-slab': 110,
  'ribbed-slab': 95,
  'waffle-slab': 100,
  'dropped-beam': 160,
  'hidden-beam': 170,
  'ground-beam': 130,
  'column-rect': 200,
  'column-circle': 200,
  'rc-wall': 110,
  stair: 110,
  ramp: 100,
  'isolated-footing': 70,
  'strip-footing': 70,
  'strap-beam': 130,
  raft: 100,
};

const BLOCK_LENGTH = 0.4;

/** Hollow blocks in one ribbed panel (one-way: rows between ribs, 400 mm blocks; waffle: none). */
export function blockCount(el: StructuralElement): number {
  const s = el.section;
  if (s.kind !== 'ribbed-slab' || s.filler === 'void' || s.ribAxis === 'both') return 0;
  const [sx, , sz] = el.size;
  const ribs = ribCentres(s.ribAxis === 'x' ? sz : sx, s.ribSpacing / 1000).length;
  const along = s.ribAxis === 'x' ? sx : sz;
  return Math.max(0, ribs - 1) * Math.max(1, Math.floor(along / BLOCK_LENGTH));
}

function areaOf(el: StructuralElement) {
  if (el.kind === 'slab' || el.kind === 'footing') return el.size[0] * el.size[2];
  if (el.kind === 'wall') return Math.max(el.size[0], el.size[2]) * el.size[1];
  if (el.kind === 'ramp' || el.kind === 'stair') return el.size[0] * el.size[2];
  return 0;
}

export function takeoff(elements: StructuralElement[]): TakeoffRow[] {
  const map = new Map<string, TakeoffRow>();
  for (const el of elements) {
    if (!el.typeId) continue;
    const story = el.story ?? 'Foundation';
    const k = `${el.typeId}|${story}`;
    const row = map.get(k) ?? { typeId: el.typeId, story, count: 0, length: 0, area: 0, concrete: 0, formwork: 0, steel: 0, blocks: 0 };
    const q = quantities(el);
    row.count++;
    if (el.kind === 'beam' || el.kind === 'column' || el.kind === 'wall') row.length += el.length;
    row.area += areaOf(el);
    row.concrete += q.concrete ?? 0;
    row.formwork += q.formwork ?? 0;
    row.steel += q.steel ?? 0;
    row.blocks += blockCount(el);
    map.set(k, row);
  }
  return [...map.values()];
}

/** Rows summed by element type, in the order given. */
export function byType(rows: TakeoffRow[], order: string[]): TakeoffRow[] {
  const map = new Map<string, TakeoffRow>();
  for (const r of rows) {
    const t = map.get(r.typeId) ?? { ...r, story: 'All', count: 0, length: 0, area: 0, concrete: 0, formwork: 0, steel: 0, blocks: 0 };
    t.count += r.count;
    t.length += r.length;
    t.area += r.area;
    t.concrete += r.concrete;
    t.formwork += r.formwork;
    t.steel += r.steel;
    t.blocks += r.blocks;
    map.set(r.typeId, t);
  }
  return [...map.values()].sort((a, b) => order.indexOf(a.typeId) - order.indexOf(b.typeId));
}

export function totals(rows: TakeoffRow[], rates?: Rates) {
  return rows.reduce(
    (t, r) => ({
      concrete: t.concrete + r.concrete,
      formwork: t.formwork + r.formwork,
      steel: t.steel + r.steel,
      steelAtRates: t.steelAtRates + r.concrete * (rates?.[r.typeId] ?? 0),
      blocks: t.blocks + r.blocks,
    }),
    { concrete: 0, formwork: 0, steel: 0, steelAtRates: 0, blocks: 0 },
  );
}

export function takeoffCsv(title: string, rows: TakeoffRow[], names: (id: string) => string, rates?: Rates): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Element', 'Story', 'Count', 'Length (m)', 'Area (m2)', 'Concrete (m3)', 'Formwork (m2)', 'Rebar from detailing (kg)', 'Rebar at rates (kg)', 'Hollow blocks'];
  const line = (r: TakeoffRow) =>
    [names(r.typeId), r.story, r.count, r.length.toFixed(2), r.area.toFixed(2), r.concrete.toFixed(2), r.formwork.toFixed(1), r.steel.toFixed(0), (r.concrete * (rates?.[r.typeId] ?? 0)).toFixed(0), r.blocks]
      .map(esc)
      .join(',');
  const t = totals(rows, rates);
  return [
    esc(`Quantity take-off — ${title}`),
    esc('Rebar from detailing: model bars where given, otherwise ACI 318-19 minimum; no laps, hooks or wastage.'),
    head.map(esc).join(','),
    ...rows.map(line),
    ['Total', '', '', '', '', t.concrete.toFixed(2), t.formwork.toFixed(1), t.steel.toFixed(0), t.steelAtRates.toFixed(0), t.blocks].map(esc).join(','),
  ].join('\r\n');
}
