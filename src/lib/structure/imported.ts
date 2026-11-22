import type { ImportedBuilding, Section, StructuralElement } from './types';
import { minimumDetailing } from '../import/detailing';

export interface ShellProp {
  kind: 'ribbed' | 'waffle' | 'solid' | 'drop' | 'mat' | 'wall';
  /** Slab / topping / wall thickness, mm */
  t: number;
  depth?: number;
  ribWidth?: number;
  ribSpacing?: number;
  /** ETABS "ribs parallel to local axis": 1 → ribs along X, 2 → along Y */
  ribAxis?: number;
}

/** A frame section's size in mm, for models whose section names do not carry it. */
export interface FrameDims {
  shape: 'rect' | 'circle' | 'steel' | 'other';
  /** Depth (ETABS D, along local axis 2) and width (B) */
  h: number;
  b: number;
  bars?: { n: number; dia: number };
  cover?: number;
}

/** The JSON written by src/lib/import/convert.ts (metres; x = ETABS X, z = −ETABS Y). */
export interface ImportedModelJson {
  meta: {
    program: string;
    reportDate: string | null;
    sources: string[];
    sectionsFrom: string;
    sectionsChangedFromModelFile?: number;
    importedAt?: string;
    units?: string;
    code?: string;
  };
  levels: { name: string; z: number }[];
  /** label, top story, x, z, section name, local-axis angle (deg) */
  columns: ([string, string, number, number, string] | [string, string, number, number, string, number])[];
  /** label, story, x1, z1, x2, z2, section name */
  beams: [string, string, number, number, number, number, string][];
  /** label, story, section name, x0, z0, x1, z1, 1 = true rectangle (0 = bounding box of a polygon) */
  slabs: ([string, string, string, number, number, number, number] | [string, string, string, number, number, number, number, number])[];
  /** label, story, section, x1, z1, x2, z2, bottom elevation, top elevation */
  walls?: [string, string, string, number, number, number, number, number, number][];
  /** Sloped floors and ramps: label, story, section, ETABS area type, corner points [x, z, elevation] */
  inclined?: [string, string, string, string, [number, number, number][]][];
  /** id, thickness, then one or more [x0, z0, x1, z1] rectangles (two = outline with a hole) */
  footings: (string | number | number[])[][];
  /** x1, z1, x2, z2, width, depth */
  straps: [number, number, number, number, number, number][];
  shell: Record<string, ShellProp>;
  frames?: Record<string, FrameDims>;
  materials?: { fc?: number; fy?: number };
  loads: { wallLinesKNm: number[]; superDeadKPa: number[]; liveKPa: number[] };
  soil: { name: string; modulus: number }[] | null;
}

/** Reinforcement that the analysis model does not carry: from the project's drawings, or ACI minimums. */
export interface Detailing {
  column(name: string, b: number, h: number, bars: { n: number; dia: number } | undefined, shape?: 'rect' | 'circle'): Section;
  beam(name: string, story: string, b: number, h: number): { section: Section; note?: string };
  slab(name: string, prop: ShellProp, widthMm: number): { kind: 'slab' | 'beam'; section: Section; note?: string };
  footing(l: number, b: number, t: number): Section;
  strap(b: number, h: number): Section;
  wall?(t: number): Section;
  stair?(waist: number, riser: number, tread: number, steps: number, width: number): Section;
  ramp?(t: number, slope: number): Section;
}

/** "COL 20X50 H 8T16" → 200 × 500, long side along X (H) or Y (V), 8 T16. */
export function parseColumnName(name: string) {
  const m = name.match(/(\d+)\s*X\s*(\d+)\s*([HV])?\s*(\d+)T(\d+)/i);
  if (!m) return null;
  return { b: Number(m[1]) * 10, h: Number(m[2]) * 10, along: (m[3] ?? 'H').toUpperCase() === 'H' ? 'x' : 'z', bars: { n: Number(m[4]), dia: Number(m[5]) } } as const;
}

/** "B 20X60" → 200 × 600 mm */
export function parseBeamName(name: string) {
  const m = name.match(/(\d+)\s*X\s*(\d+)/i);
  return m ? { b: Number(m[1]) * 10, h: Number(m[2]) * 10 } : null;
}

const r = (v: number) => Math.round(v * 1000) / 1000;
const HIDDEN_NAME = /^(H\.?\s?B|HIDDEN)/i;
const GROUND_STORY = /^(G\.?B|GB|GROUND\s*BEAM|TIE|PLINTH|FOUND)/i;
const STAIR_NAME = /STAIR|STEP|DARAJ/i;

export function buildImported(json: ImportedModelJson, given?: Detailing): ImportedBuilding & { levelNames: string[] } {
  const base = json.levels[0];
  const storeys = json.levels.slice(1);
  const levelOf = new Map(storeys.map((l, i) => [l.name, i]));
  const zOf = new Map(json.levels.map((l) => [l.name, l.z]));
  const below = new Map(storeys.map((l, i) => [l.name, json.levels[i].z]));
  const fallback = minimumDetailing(json.materials);
  const detail: Required<Detailing> = {
    ...fallback,
    ...(given ?? {}),
  } as Required<Detailing>;
  const out: StructuralElement[] = [];
  const frames = json.frames ?? {};
  const lowestStorey = storeys[0]?.name;
  const isGround = (story: string) => GROUND_STORY.test(story) || (story === lowestStorey && (zOf.get(story) ?? 1) <= 0.05);

  // a story with slabs but no dropped beams is a flat-slab floor
  const beamStories = new Set(json.beams.map((b) => b[1]));
  const slabDepth = new Map<string, number>();
  for (const s of json.slabs) {
    const p = json.shell[s[2]];
    if (p && p.kind !== 'drop') slabDepth.set(s[1], Math.max(slabDepth.get(s[1]) ?? 0, p.depth ?? p.t));
  }

  for (const c of json.columns) {
    const [label, story, x, z, name] = c;
    const ang = c[5] ?? 0;
    const named = parseColumnName(name);
    const f = frames[name];
    let b: number, h: number, along: 'x' | 'z', bars: { n: number; dia: number } | undefined, shape: 'rect' | 'circle' = 'rect';
    if (named) ({ b, h, along, bars } = named);
    else if (f && (f.shape === 'rect' || f.shape === 'circle')) {
      shape = f.shape;
      // D runs along local 2, which is global X at 0° and Y at 90°
      const turned = Math.abs(((((ang % 180) + 180) % 180) - 90)) < 45;
      [b, h] = [f.b, f.h];
      along = turned ? 'z' : 'x';
      bars = f.bars;
    } else continue;
    const top = zOf.get(story)!;
    const bot = below.get(story)!;
    const H = top - bot;
    const [sx, sz] = shape === 'circle' ? [b / 1000, b / 1000] : along === 'x' ? [h / 1000, b / 1000] : [b / 1000, h / 1000];
    out.push({
      id: `${story}-${label}`,
      kind: 'column',
      typeId: shape === 'circle' ? 'column-circle' : 'column-rect',
      label: `Column ${label}`,
      story,
      level: levelOf.get(story) ?? 0,
      grid: label,
      position: [x, r(bot + H / 2), z],
      size: [sx, r(H), sz],
      length: r(H),
      section: detail.column(name, b, shape === 'circle' ? b : h, bars, shape),
    });
  }

  for (const [label, story, x1, z1, x2, z2, name] of json.beams) {
    const p = parseBeamName(name) ?? (frames[name]?.shape === 'rect' ? { b: frames[name].b, h: frames[name].h } : null);
    if (!p) continue;
    const top = zOf.get(story)!;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const L = Math.hypot(dx, dz);
    const ang = Math.atan2(-dz, dx);
    const axisX = Math.abs(dz) < 1e-3;
    const axisZ = Math.abs(dx) < 1e-3;
    const { section, note } = detail.beam(name, story, p.b, p.h);
    const hidden = p.h <= (slabDepth.get(story) ?? 0) + 1;
    out.push({
      id: `${story}-${label}`,
      kind: 'beam',
      typeId: isGround(story) ? 'ground-beam' : hidden ? 'hidden-beam' : 'dropped-beam',
      label: `${hidden && !isGround(story) ? 'Hidden beam' : 'Beam'} ${label}`,
      story,
      level: levelOf.get(story) ?? 0,
      grid: label,
      position: [r((x1 + x2) / 2), r(top - p.h / 2000), r((z1 + z2) / 2)],
      size: axisZ ? [p.b / 1000, p.h / 1000, r(L)] : [r(L), p.h / 1000, p.b / 1000],
      ...(axisX || axisZ ? {} : { rotation: [0, ang, 0] as [number, number, number] }),
      length: r(L),
      section,
      note,
    });
  }

  for (const [label, story, name, x0, z0, x1, z1] of json.slabs) {
    const prop = json.shell[name];
    if (!prop) continue;
    const t = (prop.kind === 'ribbed' || prop.kind === 'waffle' ? prop.depth ?? prop.t : prop.t) / 1000;
    const w = Math.abs(x1 - x0);
    const d = Math.abs(z1 - z0);
    const top = zOf.get(story)!;
    const { kind, section, note } = detail.slab(name, prop, Math.round(Math.min(w, d) * 1000));
    const hidden = kind === 'beam' || HIDDEN_NAME.test(name);
    const typeId =
      kind === 'beam'
        ? 'hidden-beam'
        : prop.kind === 'ribbed'
          ? 'ribbed-slab'
          : prop.kind === 'waffle'
            ? 'waffle-slab'
            : prop.kind === 'mat'
              ? 'raft'
              : prop.kind === 'drop' || !beamStories.has(story)
                ? 'flat-slab'
                : 'solid-slab';
    out.push({
      id: `${story}-${label}`,
      kind: prop.kind === 'mat' ? 'footing' : kind,
      typeId,
      label: `${hidden ? 'Hidden beam' : prop.kind === 'drop' ? 'Drop panel' : prop.kind === 'mat' ? 'Raft' : 'Slab'} ${label}`,
      story,
      level: levelOf.get(story) ?? 0,
      grid: label,
      position: [r((x0 + x1) / 2), r(top - t / 2), r((z0 + z1) / 2)],
      size: [r(w), t, r(d)],
      length: r(Math.max(w, d)),
      section,
      note,
    });
  }

  for (const [label, story, name, x1, z1, x2, z2, zb, zt] of json.walls ?? []) {
    const prop = json.shell[name];
    if (!prop) continue;
    const t = prop.t / 1000;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const L = Math.hypot(dx, dz);
    const H = zt - zb;
    const axisZ = Math.abs(dx) < 1e-3;
    const axisX = Math.abs(dz) < 1e-3;
    out.push({
      id: `${story}-${label}`,
      kind: 'wall',
      typeId: 'rc-wall',
      label: `Wall ${label}`,
      story,
      level: levelOf.get(story) ?? 0,
      grid: label,
      position: [r((x1 + x2) / 2), r(zb + H / 2), r((z1 + z2) / 2)],
      size: axisZ ? [t, r(H), r(L)] : [r(L), r(H), t],
      ...(axisX || axisZ ? {} : { rotation: [0, Math.atan2(-dz, dx), 0] as [number, number, number] }),
      length: r(L),
      section: detail.wall(prop.t),
    });
  }

  for (const [label, story, name, , pts] of json.inclined ?? []) {
    const prop = json.shell[name];
    if (!prop || pts.length < 3) continue;
    const ys = pts.map((p) => p[2]);
    const yLow = Math.min(...ys);
    const yHigh = Math.max(...ys);
    const low = pts.filter((p) => p[2] - yLow < 0.01);
    const high = pts.filter((p) => yHigh - p[2] < 0.01);
    if (!low.length || !high.length) continue;
    const mid = (ps: [number, number, number][]) => [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length];
    const [lx, lz] = mid(low);
    const [hx, hz] = mid(high);
    const dx = hx - lx;
    const dz = hz - lz;
    const run = Math.hypot(dx, dz);
    const rise = yHigh - yLow;
    if (run < 0.1) continue;
    const width = low.length > 1 ? Math.hypot(low[0][0] - low[1][0], low[0][1] - low[1][1]) : 1.2;
    const yaw = Math.atan2(-dz, dx);
    const slope = rise / run;
    const t = prop.t / 1000;
    const base = { story, level: levelOf.get(story) ?? 0, grid: label, id: `${story}-${label}` };
    if (STAIR_NAME.test(name) || slope > 0.25) {
      const steps = Math.max(2, Math.round(rise / 0.17));
      const cos = run / Math.hypot(run, rise);
      const wv = t / cos;
      out.push({
        ...base,
        kind: 'stair',
        typeId: 'stair',
        label: `Stair ${label}`,
        position: [r((lx + hx) / 2), r(yLow - wv + (rise + wv) / 2), r((lz + hz) / 2)],
        size: [r(run), r(rise + wv), r(width)],
        rotation: [0, yaw, 0],
        length: r(Math.hypot(run, rise)),
        section: detail.stair(prop.t, Math.round((rise / steps) * 1000), Math.round((run / steps) * 1000), steps, Math.round(width * 1000)),
      });
    } else {
      const L = Math.hypot(run, rise);
      out.push({
        ...base,
        kind: 'ramp',
        typeId: 'ramp',
        label: `Ramp ${label}`,
        position: [r((lx + hx) / 2), r((yLow + yHigh) / 2 - t / 2), r((lz + hz) / 2)],
        size: [r(L), t, r(width)],
        rotation: [0, yaw, Math.atan(slope)],
        length: r(L),
        section: detail.ramp(prop.t, Math.round(slope * 1000) / 10),
      });
    }
  }

  for (const f of json.footings) {
    const [id, t, ...rects] = f as [string, number, ...[number, number, number, number][]];
    const outer = rects[0];
    const parts: [number, number, number, number][] =
      rects.length === 1
        ? [outer]
        : // an outline with a hole: the four strips between the two rectangles
          (() => {
            const inner = rects[1];
            const [ax0, az0, ax1, az1] = [Math.min(outer[0], outer[2]), Math.min(outer[1], outer[3]), Math.max(outer[0], outer[2]), Math.max(outer[1], outer[3])];
            const [bx0, bz0, bx1, bz1] = [Math.min(inner[0], inner[2]), Math.min(inner[1], inner[3]), Math.max(inner[0], inner[2]), Math.max(inner[1], inner[3])];
            return [
              [ax0, az0, ax1, bz0],
              [ax0, bz1, ax1, az1],
              [ax0, bz0, bx0, bz1],
              [bx1, bz0, ax1, bz1],
            ] as [number, number, number, number][];
          })();
    parts.forEach(([x0, z0, x1, z1], k) => {
      const w = Math.abs(x1 - x0);
      const d = Math.abs(z1 - z0);
      if (w < 0.05 || d < 0.05) return;
      const strip = rects.length > 1 || Math.max(w, d) / Math.min(w, d) > 3;
      out.push({
        id: `F-${id}-${k}`,
        kind: 'footing',
        typeId: strip ? 'strip-footing' : 'isolated-footing',
        label: rects.length === 1 ? `Footing ${id}` : `Wall strip footing ${id}`,
        story: 'Foundation',
        level: -1,
        grid: String(id),
        position: [r((x0 + x1) / 2), r(base.z - t / 2), r((z0 + z1) / 2)],
        size: [r(w), t, r(d)],
        length: r(Math.max(w, d)),
        section: detail.footing(Math.round(Math.max(w, d) * 1000), Math.round(Math.min(w, d) * 1000), Math.round(t * 1000)),
      });
    });
  }

  json.straps.forEach(([x1, z1, x2, z2, b, h], k) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const L = Math.hypot(dx, dz);
    const axisZ = Math.abs(dx) < 1e-3;
    const axisX = Math.abs(dz) < 1e-3;
    out.push({
      id: `T-${k + 1}`,
      kind: 'beam',
      typeId: 'strap-beam',
      label: `Strap beam ${k + 1}`,
      story: 'Foundation',
      level: -1,
      grid: `T${k + 1}`,
      position: [r((x1 + x2) / 2), r(base.z - h / 2), r((z1 + z2) / 2)],
      size: axisZ ? [b, h, r(L)] : [r(L), h, b],
      ...(axisX || axisZ ? {} : { rotation: [0, Math.atan2(-dz, dx), 0] as [number, number, number] }),
      length: r(L),
      section: detail.strap(Math.round(b * 1000), Math.round(h * 1000)),
    });
  });

  // footprint of the superstructure (foundation strips can reach beyond it)
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const above = out.filter((x) => x.level >= 0);
  for (const e of above.length ? above : out) {
    // plan half-extents of the turned (and pitched) member
    const [, yaw = 0, pitch = 0] = e.rotation ?? [];
    const sx = e.size[0] * Math.cos(pitch);
    const c = Math.abs(Math.cos(yaw));
    const s = Math.abs(Math.sin(yaw));
    const hx = (c * sx + s * e.size[2]) / 2;
    const hz = (s * sx + c * e.size[2]) / 2;
    minX = Math.min(minX, e.position[0] - hx);
    maxX = Math.max(maxX, e.position[0] + hx);
    minZ = Math.min(minZ, e.position[2] - hz);
    maxZ = Math.max(maxZ, e.position[2] + hz);
  }
  const topZ = json.levels[json.levels.length - 1].z;
  return {
    elements: out,
    bounds: out.length ? { w: r(maxX - minX), d: r(maxZ - minZ), h: r(topZ) } : { w: 1, d: 1, h: 1 },
    levels: json.levels,
    levelNames: storeys.map((l) => l.name),
    source: `${json.meta.program}${json.meta.reportDate ? `, report ${json.meta.reportDate}` : ''}`,
  };
}
