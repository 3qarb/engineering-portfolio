import type { BuildingSpec, Section, StructuralElement } from './types';
import { grid, letter } from './grid';

/* ── Historic coral-stone house ────────────────────────────── */
export const WALL_GROUND: Section = {
  kind: 'masonry-wall',
  t: 600,
  material: 'Coral stone (kashir) with timber ties',
  mortar: 'Hydraulic lime mortar NHL 3.5',
};
const WALL_UPPER: Section = { ...WALL_GROUND, t: 500 } as Section;
const JOIST: Section = { kind: 'timber-beam', b: 150, h: 220, species: 'Teak (replacement)', grade: 'D40 · EN 338' };
const DECK: Section = {
  kind: 'layered',
  layers: [
    { name: 'Lime screed', t: 40 },
    { name: 'Coral rubble fill', t: 120 },
    { name: 'Mangrove poles (danchal)', t: 90 },
    { name: 'Timber boards', t: 30 },
  ],
};

/** Projecting timber oriel window, the signature of Jeddah's old houses. */
export const ROSHAN: Section = {
  kind: 'layered',
  layers: [
    { name: 'Teak mashrabiya lattice', t: 40 },
    { name: 'Hardwood frame', t: 120 },
    { name: 'Timber brackets (corbels)', t: 180 },
  ],
};

/** One façade bay of a coral-stone house: two piers, a sill wall and a timber lintel round a window. */
function facadeBay(o: {
  tag: string;
  grid: string;
  label: string;
  level: number;
  base: number;
  H: number;
  t: number;
  wall: Section;
  along: 'x' | 'z';
  start: number;
  span: number;
  at: number;
  /** Outward side of the façade: +1 or −1 along its normal; 0 = no roshan */
  roshan: number;
}): StructuralElement[] {
  const ow = o.span * 0.42;
  const pier = (o.span - ow) / 2;
  const sillH = 0.9;
  const lintelH = 0.22;
  const headH = o.H - sillH - 1.75 - lintelH; // masonry above the lintel
  const place = (offset: number, y: number, len: number, h: number, depth = o.t): Pick<StructuralElement, 'position' | 'size'> =>
    o.along === 'x'
      ? { position: [o.start + offset, y, o.at], size: [len, h, depth] }
      : { position: [o.at, y, o.start + offset], size: [depth, h, len] };
  // End-wall piers reach half a wall thickness past the grid so the corners close
  const cz = o.along === 'z' ? o.t / 2 : 0;
  const common = { kind: 'wall' as const, level: o.level, grid: o.grid };
  const lintel: Section = { kind: 'timber-beam', b: Math.round(o.t * 1000), h: 220, species: 'Teak lintel', grade: 'D40 · EN 338' };
  return [
    { ...common, id: `WP1-${o.tag}`, label: `Façade pier ${o.label}`, length: o.H, section: o.wall, ...place(pier / 2 - cz / 2, o.base + o.H / 2, pier + cz, o.H) },
    { ...common, id: `WP2-${o.tag}`, label: `Façade pier ${o.label}`, length: o.H, section: o.wall, ...place(o.span - pier / 2 + cz / 2, o.base + o.H / 2, pier + cz, o.H) },
    { ...common, id: `WS-${o.tag}`, label: `Sill wall ${o.label}`, length: ow, section: o.wall, ...place(o.span / 2, o.base + sillH / 2, ow, sillH) },
    {
      ...common,
      kind: 'beam',
      id: `WL-${o.tag}`,
      label: `Timber lintel ${o.label}`,
      length: ow + 0.4,
      section: lintel,
      ...place(o.span / 2, o.base + o.H - headH - lintelH / 2, ow, lintelH),
    },
    { ...common, id: `WH-${o.tag}`, label: `Wall over lintel ${o.label}`, length: ow, section: o.wall, ...place(o.span / 2, o.base + o.H - headH / 2, ow, headH) },
    ...(o.roshan && o.level > 0 ? roshanParts(o, ow, sillH) : []),
  ];
}

/** Roshan body with its projecting crown and bracketed base. */
function roshanParts(
  o: { tag: string; label: string; level: number; grid: string; base: number; t: number; along: 'x' | 'z'; start: number; span: number; at: number; roshan: number },
  ow: number,
  sillH: number,
): StructuralElement[] {
  const parts: { key: string; name: string; y: number; h: number; depth: number; extra: number }[] = [
    { key: 'B', name: 'Roshan base (brackets)', y: o.base + sillH * 0.35 - 0.12, h: 0.28, depth: 0.72, extra: 0.12 },
    { key: 'R', name: 'Roshan (timber oriel)', y: o.base + sillH * 0.35 + 1.25, h: 2.5, depth: 0.6, extra: 0 },
    { key: 'C', name: 'Roshan crown', y: o.base + sillH * 0.35 + 2.62, h: 0.26, depth: 0.76, extra: 0.14 },
  ];
  return parts.map((p) => {
    const w = ow + 0.5 + p.extra;
    const out = o.roshan * (o.t / 2 + p.depth / 2);
    return {
      kind: 'wall' as const,
      level: o.level,
      grid: o.grid,
      id: `W${p.key}-${o.tag}`,
      label: `${p.name} ${o.label}`,
      length: w,
      section: ROSHAN,
      note: 'Projecting teak window with mashrabiya lattice, carried on timber brackets.',
      ...(o.along === 'x'
        ? { position: [o.start + o.span / 2, p.y, o.at + out] as [number, number, number], size: [w, p.h, p.depth] as [number, number, number] }
        : { position: [o.at + out, p.y, o.start + o.span / 2] as [number, number, number], size: [p.depth, p.h, w] as [number, number, number] }),
    };
  });
}

export function heritage(spec: BuildingSpec): StructuralElement[] {
  const out: StructuralElement[] = [];
  const { xs, zs } = grid(spec);
  const H = spec.storeyHeight;
  const deckT = 0.28;

  for (let L = 0; L < spec.floors; L++) {
    const base = L * H;
    const wall = L === 0 ? WALL_GROUND : WALL_UPPER;
    const t = (wall as { t: number }).t / 1000;

    // Walls along X: façades get a window per bay, interior spines stay solid
    zs.forEach((z, j) =>
      xs.slice(0, -1).forEach((x, i) => {
        const span = xs[i + 1] - x;
        const inner = j > 0 && j < zs.length - 1;
        const tag = `${letter(i)}${letter(i + 1)}${j + 1}-L${L}`;
        const grid = `${letter(i)}–${letter(i + 1)}/${j + 1}`;
        if (inner) {
          out.push({
            id: `W-${tag}`,
            kind: 'wall',
            label: `Spine wall ${letter(i)}–${letter(i + 1)} / ${j + 1}`,
            level: L,
            grid,
            position: [x + span / 2, base + H / 2, z],
            size: [span, H, t * 0.8],
            length: span,
            section: { ...(wall as Extract<Section, { kind: 'masonry-wall' }>), t: Math.round(t * 800) },
          });
        } else {
          out.push(...facadeBay({ tag, grid, label: `${letter(i)}–${letter(i + 1)} / ${j + 1}`, level: L, base, H, t, wall, along: 'x', start: x, span, at: z, roshan: j === zs.length - 1 ? 1 : 0 }));
        }
      }),
    );
    // End walls along Z, with windows
    [0, xs.length - 1].forEach((i) =>
      zs.slice(0, -1).forEach((z, j) => {
        const span = zs[j + 1] - z;
        out.push(
          ...facadeBay({
            tag: `${letter(i)}${j + 1}${j + 2}-L${L}`,
            grid: `${letter(i)}/${j + 1}–${j + 2}`,
            label: `${letter(i)} / ${j + 1}–${j + 2}`,
            level: L,
            base,
            H,
            t,
            wall,
            along: 'z',
            start: z,
            span,
            at: xs[i],
            roshan: 0,
          }),
        );
      }),
    );

    // Timber joists spanning Z between walls, decks over each bay
    xs.slice(0, -1).forEach((x, i) =>
      zs.slice(0, -1).forEach((z, j) => {
        const sx = xs[i + 1] - x;
        const sz = zs[j + 1] - z;
        const count = Math.max(2, Math.floor((sx - 0.3) / 0.6));
        for (let k = 0; k < count; k++) {
          const px = x + 0.3 + ((sx - 0.6) * (k + 0.5)) / count;
          out.push({
            id: `J-${letter(i)}${j + 1}-${k + 1}-L${L}`,
            kind: 'beam',
            label: `Timber joist ${k + 1}, bay ${letter(i)}${letter(i + 1)}/${j + 1}${j + 2}`,
            level: L,
            grid: `${letter(i)}–${letter(i + 1)}/${j + 1}–${j + 2}`,
            position: [px, base + H - deckT - 0.11, z + sz / 2],
            size: [0.15, 0.22, sz - t],
            length: sz,
            section: JOIST,
          });
        }
        out.push({
          id: `D-${letter(i)}${j + 1}-L${L}`,
          kind: 'slab',
          label: `Floor deck ${letter(i)}${letter(i + 1)}/${j + 1}${j + 2}`,
          level: L,
          grid: `${letter(i)}–${letter(i + 1)}/${j + 1}–${j + 2}`,
          position: [x + sx / 2, base + H - deckT / 2, z + sz / 2],
          size: [sx - t, deckT, sz - t],
          length: Math.min(sx, sz),
          section: DECK,
        });
      }),
    );
  }
  return out;
}
