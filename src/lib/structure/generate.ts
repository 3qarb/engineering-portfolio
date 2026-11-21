import type { BuildingSpec, RcFrameSections, StructuralElement } from './types';

import { grid, letter } from './grid';
import { heritage } from './heritage';
import { scaffold } from './scaffold';
export const levelName = (level: number, names?: string[]) =>
  level < 0 ? 'Foundation' : names?.[level] ?? `Storey ${String(level + 1).padStart(2, '0')}`;

/** The level a member belongs to, by its imported story name when it has one. */
export const elementLevel = (el: StructuralElement) => el.story ?? levelName(el.level);

export function buildingBounds(spec: BuildingSpec) {
  if (spec.imported) return spec.imported.bounds;
  const w = spec.baysX.reduce((a, b) => a + b, 0);
  const d = spec.baysZ.reduce((a, b) => a + b, 0);
  const h = spec.floors * spec.storeyHeight;
  return { w, d, h };
}

/* ── Reinforced concrete frame ─────────────────────────────── */

function rcFrame(spec: BuildingSpec, rc: RcFrameSections): StructuralElement[] {
  const out: StructuralElement[] = [];
  const { xs, zs } = grid(spec);
  const H = spec.storeyHeight;
  const bd = rc.beam.h / 1000;
  const bw = rc.beam.b / 1000;
  const t = rc.slab.t / 1000;
  const lowerUntil = Math.ceil(spec.floors / 2);

  xs.forEach((x, i) =>
    zs.forEach((z, j) => {
      const f = rc.footing;
      out.push({
        id: `F-${letter(i)}${j + 1}`,
        kind: 'footing',
        label: `Footing ${letter(i)}${j + 1}`,
        level: -1,
        grid: `${letter(i)}/${j + 1}`,
        position: [x, -f.t / 2000, z],
        size: [f.l / 1000, f.t / 1000, f.b / 1000],
        length: f.l / 1000,
        section: f,
      });
    }),
  );

  for (let L = 0; L < spec.floors; L++) {
    const base = L * H;
    const col = rc.columnLower && L < lowerUntil ? rc.columnLower : rc.column;
    const cb = col.b / 1000;
    const ch = col.h / 1000;

    xs.forEach((x, i) =>
      zs.forEach((z, j) => {
        out.push({
          id: `C-${letter(i)}${j + 1}-L${L}`,
          kind: 'column',
          label: `Column ${letter(i)}${j + 1}`,
          level: L,
          grid: `${letter(i)}/${j + 1}`,
          // full storey height, so the beam–column joint is solid concrete
          position: [x, base + H / 2, z],
          size: [cb, H, ch],
          length: H,
          section: col,
        });
      }),
    );

    const beamY = base + H - bd / 2;
    zs.forEach((z, j) =>
      xs.slice(0, -1).forEach((x, i) => {
        const span = xs[i + 1] - x;
        out.push({
          id: `B-${letter(i)}${letter(i + 1)}${j + 1}-L${L}`,
          kind: 'beam',
          label: `Beam ${letter(i)}–${letter(i + 1)} on grid ${j + 1}`,
          level: L,
          grid: `${letter(i)}–${letter(i + 1)}/${j + 1}`,
          position: [x + span / 2, beamY, z],
          size: [span - cb, bd, bw],
          length: span,
          section: rc.beam,
        });
      }),
    );
    xs.forEach((x, i) =>
      zs.slice(0, -1).forEach((z, j) => {
        const span = zs[j + 1] - z;
        out.push({
          id: `B-${letter(i)}${j + 1}${j + 2}-L${L}`,
          kind: 'beam',
          label: `Beam ${j + 1}–${j + 2} on grid ${letter(i)}`,
          level: L,
          grid: `${letter(i)}/${j + 1}–${j + 2}`,
          position: [x, beamY, z + span / 2],
          size: [bw, bd, span - ch],
          length: span,
          section: rc.beam,
        });
      }),
    );

    xs.slice(0, -1).forEach((x, i) =>
      zs.slice(0, -1).forEach((z, j) => {
        const sx = xs[i + 1] - x;
        const sz = zs[j + 1] - z;
        out.push({
          id: `S-${letter(i)}${j + 1}-L${L}`,
          kind: 'slab',
          label: `Slab panel ${letter(i)}${letter(i + 1)}/${j + 1}${j + 2}`,
          level: L,
          grid: `${letter(i)}–${letter(i + 1)}/${j + 1}–${j + 2}`,
          position: [x + sx / 2, base + H - t / 2, z + sz / 2],
          size: [sx - bw, t, sz - bw],
          length: Math.min(sx, sz),
          section: rc.slab,
        });
      }),
    );
  }
  return out;
}

export function generateElements(spec: BuildingSpec): StructuralElement[] {
  if (spec.imported) return spec.imported.elements;
  if (spec.system === 'heritage-masonry') return heritage(spec);
  if (spec.system === 'scaffold') return scaffold(spec);
  if (!spec.rc) return [];
  return rcFrame(spec, spec.rc);
}

const cache = new Map<string, StructuralElement[]>();
/** Memoised by spec identity + content so the scene and panels share one list. */
export function elementsFor(spec: BuildingSpec): StructuralElement[] {
  if (spec.imported) return spec.imported.elements;
  const key = JSON.stringify(spec);
  let hit = cache.get(key);
  if (!hit) {
    hit = generateElements(spec);
    cache.set(key, hit);
  }
  return hit;
}

export interface RcInput {
  colB: number;
  colH: number;
  barN: number;
  barDia: number;
  tieDia: number;
  tieSpacing: number;
  beamB: number;
  beamH: number;
  slabT: number;
  concrete: string;
  steel: string;
}

export function makeRcSections(i: RcInput): RcFrameSections {
  const cover = 40;
  return {
    column: {
      kind: 'rc-column',
      b: i.colB,
      h: i.colH,
      cover,
      bars: { n: i.barN, dia: i.barDia },
      ties: { dia: i.tieDia, spacing: i.tieSpacing },
      concrete: i.concrete,
      steel: i.steel,
    },
    beam: {
      kind: 'rc-beam',
      b: i.beamB,
      h: i.beamH,
      cover: 30,
      top: { n: 3, dia: 16 },
      bottom: { n: 4, dia: 20 },
      stirrups: { dia: 10, spacing: 150, legs: 2 },
      concrete: i.concrete,
      steel: i.steel,
    },
    slab: {
      kind: 'rc-slab',
      t: i.slabT,
      cover: 25,
      bottom: { dia: 12, spacing: 200 },
      top: { dia: 10, spacing: 200 },
      concrete: i.concrete,
      steel: i.steel,
    },
    footing: {
      kind: 'rc-footing',
      b: 2200,
      l: 2200,
      t: 700,
      cover: 75,
      bottom: { dia: 16, spacing: 150 },
      concrete: i.concrete,
      steel: i.steel,
    },
  };
}
