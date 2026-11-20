import type { StructuralElement } from './types';

type V3 = [number, number, number];

export interface CageBar {
  from: V3;
  to: V3;
  dia: number; // metres
}

export interface CageLoop {
  /** Centre of the loop, element-local metres */
  center: V3;
  /** Loop axis: the member's long axis */
  axis: 'x' | 'y' | 'z';
  /** Loop width/height in the plane across the axis, metres */
  w: number;
  h: number;
  dia: number;
}

export interface Cage {
  bars: CageBar[];
  loops: CageLoop[];
}

/** Spread n bars round the perimeter of a rectangle, corners first (shared with the 2D drawing). */
export function perimeterBars(n: number, x0: number, y0: number, w: number, h: number): [number, number][] {
  const pts: [number, number][] = [
    [x0, y0],
    [x0 + w, y0],
    [x0 + w, y0 + h],
    [x0, y0 + h],
  ];
  const rest = Math.max(0, n - 4);
  const kx = Math.round((rest * w) / (2 * (w + h)));
  const ky = rest - 2 * kx;
  const kl = Math.ceil(ky / 2);
  const kr = Math.floor(ky / 2);
  for (let i = 1; i <= kx; i++) {
    const x = x0 + (w * i) / (kx + 1);
    pts.push([x, y0], [x, y0 + h]);
  }
  for (let i = 1; i <= kl; i++) pts.push([x0, y0 + (h * i) / (kl + 1)]);
  for (let i = 1; i <= kr; i++) pts.push([x0 + w, y0 + (h * i) / (kr + 1)]);
  return pts;
}

const MM = 0.001;

/** Rebar cage of a reinforced-concrete member in its local frame, or null for other materials. */
export function cageFor(el: StructuralElement): Cage | null {
  const s = el.section;
  const [sx, sy, sz] = el.size;

  if (s.kind === 'rc-column') {
    const e = (s.cover + s.ties.dia + s.bars.dia / 2) * MM;
    const ti = (s.cover + s.ties.dia / 2) * MM;
    const b = s.b * MM;
    const h = s.h * MM;
    const bars = perimeterBars(s.bars.n, -b / 2 + e, -h / 2 + e, b - 2 * e, h - 2 * e).map(([x, z]) => ({
      from: [x, -sy / 2, z] as V3,
      to: [x, sy / 2 + 0.25, z] as V3, // starter bars lap into the joint above
      dia: s.bars.dia * MM,
    }));
    const step = s.ties.spacing * MM;
    const count = Math.max(2, Math.floor(sy / step));
    const loops: CageLoop[] = Array.from({ length: count }, (_, i) => ({
      center: [0, -sy / 2 + step / 2 + i * step, 0] as V3,
      axis: 'y',
      w: b - 2 * ti,
      h: h - 2 * ti,
      dia: s.ties.dia * MM,
    }));
    return { bars, loops };
  }

  if (s.kind === 'rc-beam') {
    const alongX = sx >= sz;
    const len = alongX ? sx : sz;
    const b = s.b * MM;
    const h = s.h * MM;
    const c = (s.cover + s.stirrups.dia) * MM;
    const place = (along: number, across: number, y: number): V3 => (alongX ? [along, y, across] : [across, y, along]);
    const row = (n: number, dia: number, top: boolean): CageBar[] => {
      const y = top ? h / 2 - c - (dia * MM) / 2 : -h / 2 + c + (dia * MM) / 2;
      const half = b / 2 - c - (dia * MM) / 2;
      return Array.from({ length: n }, (_, i) => {
        const a = n === 1 ? 0 : -half + (2 * half * i) / (n - 1);
        return { from: place(-len / 2 - 0.2, a, y), to: place(len / 2 + 0.2, a, y), dia: dia * MM };
      });
    };
    const step = s.stirrups.spacing * MM;
    const count = Math.max(2, Math.floor(len / step));
    const si = (s.cover + s.stirrups.dia / 2) * MM;
    const loops: CageLoop[] = Array.from({ length: count }, (_, i) => ({
      center: place(-len / 2 + step / 2 + i * step, 0, 0),
      axis: alongX ? 'x' : 'z',
      w: b - 2 * si,
      h: h - 2 * si,
      dia: s.stirrups.dia * MM,
    }));
    return { bars: [...row(s.top.n, s.top.dia, true), ...row(s.bottom.n, s.bottom.dia, false)], loops };
  }

  if (s.kind === 'rc-slab' || s.kind === 'rc-footing') {
    const t = sy;
    const bars: CageBar[] = [];
    const mesh = (dia: number, spacing: number, yBase: number) => {
      const d = dia * MM;
      const sp = spacing * MM;
      const edge = s.cover * MM;
      for (let z = -sz / 2 + edge; z <= sz / 2 - edge; z += sp)
        bars.push({ from: [-sx / 2 + edge, yBase, z], to: [sx / 2 - edge, yBase, z], dia: d });
      for (let x = -sx / 2 + edge; x <= sx / 2 - edge; x += sp)
        bars.push({ from: [x, yBase + d, -sz / 2 + edge], to: [x, yBase + d, sz / 2 - edge], dia: d });
    };
    const bottom = s.bottom;
    mesh(bottom.dia, bottom.spacing, -t / 2 + (s.cover + bottom.dia / 2) * MM);
    if (s.kind === 'rc-slab' && s.top) mesh(s.top.dia, s.top.spacing, t / 2 - (s.cover + s.top.dia * 1.5) * MM);
    return { bars, loops: [] };
  }

  return null;
}
