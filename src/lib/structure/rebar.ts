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
  /** Circular hoop or spiral turn (w = h = diameter) */
  round?: boolean;
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

/** Straight bars at a spacing across a span, centred, inside the edge distance. */
function spread(span: number, spacing: number, edge: number): number[] {
  const usable = span - 2 * edge;
  if (usable <= 0) return [0];
  const n = Math.max(1, Math.floor(usable / spacing) + 1);
  const start = -((n - 1) * spacing) / 2;
  return Array.from({ length: n }, (_, i) => start + i * spacing);
}

/** Two-way mesh in a horizontal plane of a box sx × sz at height y. */
function planMesh(bars: CageBar[], sx: number, sz: number, dia: number, spacing: number, y: number, edge: number) {
  const d = dia * MM;
  const sp = spacing * MM;
  for (const z of spread(sz, sp, edge)) bars.push({ from: [-sx / 2 + edge, y, z], to: [sx / 2 - edge, y, z], dia: d });
  for (const x of spread(sx, sp, edge)) bars.push({ from: [x, y + d, -sz / 2 + edge], to: [x, y + d, sz / 2 - edge], dia: d });
}

/** Rib centres across a panel width, metres */
export function ribCentres(width: number, spacing: number): number[] {
  const n = Math.max(1, Math.round(width / spacing));
  return Array.from({ length: n }, (_, i) => -width / 2 + spacing * (i + 0.5));
}

/** Stair geometry in the element's local frame: run along x, rise along y, width along z. */
export function stairProfile(s: { waist: number; riser: number; tread: number; steps: number }, size: [number, number, number]) {
  const [run, sy] = size;
  const rise = (s.riser * s.steps) / 1000;
  const wv = Math.max(0.01, sy - rise); // waist measured vertically
  const y0 = -sy / 2;
  const T = run / s.steps;
  const r = rise / s.steps;
  const pts: [number, number][] = [
    [-run / 2, y0],
    [run / 2, y0 + rise],
    [run / 2, y0 + rise + wv],
  ];
  for (let k = s.steps - 1; k >= 0; k--) {
    const x = -run / 2 + k * T;
    pts.push([x, y0 + wv + (k + 1) * r], [x, y0 + wv + k * r]);
  }
  return { pts, rise, wv, y0, cos: run / Math.hypot(run, rise) };
}

/** Rebar cage of a reinforced-concrete member in its local frame, or null for other materials. */
export function cageFor(el: StructuralElement): Cage | null {
  const s = el.section;
  const [sx, sy, sz] = el.size;

  if (s.kind === 'rc-column' && s.shape === 'circle') {
    const d = s.b * MM;
    const R = d / 2 - (s.cover + s.ties.dia + s.bars.dia / 2) * MM;
    const bars = Array.from({ length: s.bars.n }, (_, i) => {
      const a = (i / s.bars.n) * Math.PI * 2;
      return { from: [Math.cos(a) * R, -sy / 2, Math.sin(a) * R] as V3, to: [Math.cos(a) * R, sy / 2 + 0.25, Math.sin(a) * R] as V3, dia: s.bars.dia * MM };
    });
    const step = s.ties.spacing * MM;
    const hoop = d - 2 * (s.cover + s.ties.dia / 2) * MM;
    const count = Math.max(2, Math.floor(sy / step));
    const loops: CageLoop[] = Array.from({ length: count }, (_, i) => ({
      center: [0, -sy / 2 + step / 2 + i * step, 0] as V3,
      axis: 'y',
      w: hoop,
      h: hoop,
      dia: s.ties.dia * MM,
      round: true,
    }));
    return { bars, loops };
  }

  if (s.kind === 'rc-column') {
    const e = (s.cover + s.ties.dia + s.bars.dia / 2) * MM;
    const ti = (s.cover + s.ties.dia / 2) * MM;
    // the section's b and h follow the member's plan size (a column may be turned either way)
    const turned = Math.abs(sx - s.h * MM) < Math.abs(sx - s.b * MM) && s.b !== s.h;
    const b = (turned ? s.h : s.b) * MM;
    const h = (turned ? s.b : s.h) * MM;
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
    if (s.top) mesh(s.top.dia, s.top.spacing, t / 2 - (s.cover + s.top.dia * 1.5) * MM);
    return { bars, loops: [] };
  }

  if (s.kind === 'ramp') {
    const bars: CageBar[] = [];
    const edge = s.cover * MM;
    planMesh(bars, sx, sz, s.bottom.dia, s.bottom.spacing, -sy / 2 + (s.cover + s.bottom.dia / 2) * MM, edge);
    if (s.top) planMesh(bars, sx, sz, s.top.dia, s.top.spacing, sy / 2 - (s.cover + s.top.dia * 1.5) * MM, edge);
    return { bars, loops: [] };
  }

  if (s.kind === 'ribbed-slab') {
    const bars: CageBar[] = [];
    const loops: CageLoop[] = [];
    const c = (s.cover + s.ribLinks.dia) * MM;
    const sp = s.ribSpacing * MM;
    const bw = s.ribWidth * MM;
    const si = (s.cover + s.ribLinks.dia / 2) * MM;
    const ribRun = (alongX: boolean) => {
      const len = alongX ? sx : sz;
      const across = alongX ? sz : sx;
      const place = (a: number, b: number, y: number): V3 => (alongX ? [a, y, b] : [b, y, a]);
      // in a waffle the second direction sits one bar higher where the ribs cross
      const lift = s.ribAxis === 'both' && !alongX ? Math.max(s.ribBars.bottom.dia, s.ribBars.top.dia) * MM : 0;
      for (const r of ribCentres(across, sp)) {
        const row = (n: number, dia: number, y: number) => {
          const half = bw / 2 - c - (dia * MM) / 2;
          for (let i = 0; i < n; i++) {
            const a = n === 1 ? 0 : -half + (2 * half * i) / (n - 1);
            bars.push({ from: place(-len / 2 + 0.03, r + a, y), to: place(len / 2 - 0.03, r + a, y), dia: dia * MM });
          }
        };
        row(s.ribBars.bottom.n, s.ribBars.bottom.dia, -sy / 2 + c + (s.ribBars.bottom.dia * MM) / 2 + lift);
        row(s.ribBars.top.n, s.ribBars.top.dia, sy / 2 - c - (s.ribBars.top.dia * MM) / 2 - lift);
        const step = s.ribLinks.spacing * MM;
        const count = Math.max(2, Math.floor(len / step));
        for (let i = 0; i < count; i++) {
          loops.push({ center: place(-len / 2 + step / 2 + i * step, r, 0), axis: alongX ? 'x' : 'z', w: bw - 2 * si, h: sy - 2 * si, dia: s.ribLinks.dia * MM });
        }
      }
    };
    if (s.ribAxis === 'both') {
      ribRun(true);
      ribRun(false);
    } else ribRun(s.ribAxis === 'x');
    if (s.toppingMesh) planMesh(bars, sx, sz, s.toppingMesh.dia, s.toppingMesh.spacing, sy / 2 - (s.topping * MM) / 2, s.cover * MM);
    return { bars, loops };
  }

  if (s.kind === 'rc-wall') {
    const alongX = sx >= sz;
    const L = alongX ? sx : sz;
    const t = s.t * MM;
    const place = (a: number, y: number, b: number): V3 => (alongX ? [a, y, b] : [b, y, a]);
    const bars: CageBar[] = [];
    const vd = s.vertical.dia * MM;
    const hd = s.horizontal.dia * MM;
    // horizontal bars outside, vertical bars inside them
    const faces = s.layers === 2 ? [-1, 1] : [0];
    for (const f of faces) {
      const oh = f * (t / 2 - (s.cover * MM + hd / 2));
      const ov = f * (t / 2 - (s.cover * MM + hd + vd / 2));
      for (const a of spread(L, s.vertical.spacing * MM, s.cover * MM)) bars.push({ from: place(a, -sy / 2, ov), to: place(a, sy / 2 + 0.25, ov), dia: vd });
      for (const y of spread(sy, s.horizontal.spacing * MM, 0.05)) bars.push({ from: place(-L / 2 + s.cover * MM, y, oh), to: place(L / 2 - s.cover * MM, y, oh), dia: hd });
    }
    return { bars, loops: [] };
  }

  if (s.kind === 'stair') {
    const { rise, y0, cos } = stairProfile(s, el.size);
    const run = sx;
    const bars: CageBar[] = [];
    const md = s.main.dia * MM;
    const dd = s.distribution.dia * MM;
    const off = (s.cover * MM + md / 2) / cos;
    const edge = s.cover * MM;
    // main bars on the soffit, along the slope
    for (const z of spread(sz, s.main.spacing * MM, edge)) bars.push({ from: [-run / 2, y0 + off, z], to: [run / 2, y0 + rise + off, z], dia: md });
    // distribution bars across the flight, on top of the main bars
    const sloped = Math.hypot(run, rise);
    const n = Math.max(2, Math.floor(sloped / (s.distribution.spacing * MM)));
    for (let i = 0; i <= n; i++) {
      const f = 0.02 + (0.96 * i) / n;
      const y = y0 + rise * f + off + (md / 2 + dd / 2) / cos;
      bars.push({ from: [-run / 2 + run * f, y, -sz / 2 + edge], to: [-run / 2 + run * f, y, sz / 2 - edge], dia: dd });
    }
    return { bars, loops: [] };
  }

  return null;
}
