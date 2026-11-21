import type { ImportedBuilding, Section, StructuralElement } from './types';

/** The JSON written by scripts/import-etabs.mjs (metres; x = ETABS X, z = −ETABS Y). */
export interface ImportedModelJson {
  meta: { program: string; reportDate: string | null; sources: string[]; sectionsFrom: string };
  levels: { name: string; z: number }[];
  /** label, top story, x, z, section name */
  columns: [string, string, number, number, string][];
  /** label, story, x1, z1, x2, z2, section name */
  beams: [string, string, number, number, number, number, string][];
  /** label, story, section name, x0, z0, x1, z1 */
  slabs: [string, string, string, number, number, number, number][];
  /** id, thickness, then one or more [x0, z0, x1, z1] rectangles (two = outline with a hole) */
  footings: (string | number | number[])[][];
  /** x1, z1, x2, z2, width, depth */
  straps: [number, number, number, number, number, number][];
  shell: Record<string, { kind: 'ribbed' | 'solid'; t: number; depth?: number; ribWidth?: number; ribSpacing?: number; ribAxis?: number }>;
  loads: { wallLinesKNm: number[]; superDeadKPa: number[]; liveKPa: number[] };
  soil: { name: string; modulus: number }[] | null;
}

/** Reinforcement that the analysis model does not carry: taken from the project's drawings. */
export interface Detailing {
  column(name: string, b: number, h: number, bars: { n: number; dia: number }): Section;
  beam(name: string, story: string, b: number, h: number): { section: Section; note?: string };
  slab(name: string, prop: ImportedModelJson['shell'][string], widthMm: number): { kind: 'slab' | 'beam'; section: Section; note?: string };
  footing(l: number, b: number, t: number): Section;
  strap(b: number, h: number): Section;
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

export function buildImported(json: ImportedModelJson, detail: Detailing): ImportedBuilding & { levelNames: string[] } {
  const base = json.levels[0];
  const storeys = json.levels.slice(1);
  const levelOf = new Map(storeys.map((l, i) => [l.name, i]));
  const zOf = new Map(json.levels.map((l) => [l.name, l.z]));
  const below = new Map(storeys.map((l, i) => [l.name, json.levels[i].z]));
  const out: StructuralElement[] = [];

  for (const [label, story, x, z, name] of json.columns) {
    const p = parseColumnName(name);
    if (!p) continue;
    const top = zOf.get(story)!;
    const bot = below.get(story)!;
    const H = top - bot;
    const [sx, sz] = p.along === 'x' ? [p.h / 1000, p.b / 1000] : [p.b / 1000, p.h / 1000];
    out.push({
      id: `${story}-${label}`,
      kind: 'column',
      label: `Column ${label}`,
      story,
      level: levelOf.get(story) ?? 0,
      grid: label,
      position: [x, r(bot + H / 2), z],
      size: [sx, r(H), sz],
      length: r(H),
      section: detail.column(name, p.b, p.h, p.bars),
    });
  }

  for (const [label, story, x1, z1, x2, z2, name] of json.beams) {
    const p = parseBeamName(name);
    if (!p) continue;
    const top = zOf.get(story)!;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const L = Math.hypot(dx, dz);
    const ang = Math.atan2(-dz, dx);
    const axisX = Math.abs(dz) < 1e-3;
    const axisZ = Math.abs(dx) < 1e-3;
    const { section, note } = detail.beam(name, story, p.b, p.h);
    out.push({
      id: `${story}-${label}`,
      kind: 'beam',
      label: `Beam ${label}`,
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
    const t = (prop.kind === 'ribbed' ? prop.depth ?? prop.t : prop.t) / 1000;
    const w = Math.abs(x1 - x0);
    const d = Math.abs(z1 - z0);
    const top = zOf.get(story)!;
    const { kind, section, note } = detail.slab(name, prop, Math.round(Math.min(w, d) * 1000));
    out.push({
      id: `${story}-${label}`,
      kind,
      label: `${kind === 'beam' ? 'Hidden beam' : 'Slab'} ${label}`,
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
      out.push({
        id: `F-${id}-${k}`,
        kind: 'footing',
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

  // extents
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  // footprint of the superstructure (foundation strips can reach beyond it)
  for (const e of out.filter((x) => x.level >= 0)) {
    minX = Math.min(minX, e.position[0] - e.size[0] / 2);
    maxX = Math.max(maxX, e.position[0] + e.size[0] / 2);
    minZ = Math.min(minZ, e.position[2] - e.size[2] / 2);
    maxZ = Math.max(maxZ, e.position[2] + e.size[2] / 2);
  }
  const topZ = json.levels[json.levels.length - 1].z;
  return {
    elements: out,
    bounds: { w: r(maxX - minX), d: r(maxZ - minZ), h: r(topZ) },
    levels: json.levels,
    levelNames: storeys.map((l) => l.name),
    source: `${json.meta.program}${json.meta.reportDate ? `, report ${json.meta.reportDate}` : ''}`,
  };
}
