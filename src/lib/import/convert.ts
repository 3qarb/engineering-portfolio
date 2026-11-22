// ETABS (+ SAFE) model text → the compact JSON the 3D explorer reads (ImportedModelJson).
// Shared by the browser and scripts/import-etabs.mjs; type-only imports outside this folder.
import type { FrameDims, ImportedModelJson, ShellProp } from '../structure/imported';
import { readEt, readSafe, type EtModel, type SafeModel } from './etabs.ts';

export interface ConvertInput {
  etText: string;
  safeText?: string;
  /** Label shown on the site for the source, e.g. "ETABS model (May 2026)" */
  source?: string;
  /** File names, kept in meta.sources */
  fileNames?: string[];
  /** Issued sections from a model report: key `${story}|${label}` */
  issued?: Map<string, string>;
}

export interface ConvertResult {
  json: ImportedModelJson;
  et: EtModel;
  safe: SafeModel | null;
  /** Things the reader could not draw, for the report */
  skipped: { what: string; count: number }[];
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const STD_BARS = [8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40];
const barFromArea = (a: number) => STD_BARS.reduce((best, d) => (Math.abs((Math.PI * d * d) / 4 - a) < Math.abs((Math.PI * best * best) / 4 - a) ? d : best), 16);
const barFromSize = (s: string) => {
  const imp = s.match(/^#(\d+)$/);
  if (imp) return Math.round((Number(imp[1]) * 25.4) / 8);
  const d = s.match(/(\d+)/);
  return d ? Number(d[1]) : undefined;
};

/**
 * A plan polygon as rectangles [x0, y0, x1, y1]: vertical strips between vertex x values, each cut
 * where the strip's centre line crosses the outline, then strips with the same cut merged.
 */
export function rectanglesOf(poly: [number, number][], tol = 1e-6): [number, number, number, number][] {
  // vertex x values, with values closer than the tolerance taken as one
  const xs: number[] = [];
  for (const x of poly.map((p) => p[0]).sort((a, b) => a - b)) if (!xs.length || x - xs[xs.length - 1] > tol) xs.push(x);
  const out: [number, number, number, number][] = [];
  let open: [number, number, number, number][] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xb] = [xs[i], xs[i + 1]];
    if (xb - xa < tol) continue;
    const xm = (xa + xb) / 2;
    const ys: number[] = [];
    for (let k = 0; k < poly.length; k++) {
      const [p, q] = [poly[k], poly[(k + 1) % poly.length]];
      if ((p[0] - xm) * (q[0] - xm) < 0) ys.push(p[1] + ((xm - p[0]) * (q[1] - p[1])) / (q[0] - p[0]));
    }
    ys.sort((a, b) => a - b);
    const cuts: [number, number][] = [];
    for (let k = 0; k + 1 < ys.length; k += 2) cuts.push([ys[k], ys[k + 1]]);
    const next: [number, number, number, number][] = [];
    for (const [y0, y1] of cuts) {
      const j = open.findIndex((o) => Math.abs(o[1] - y0) < tol && Math.abs(o[3] - y1) < tol && Math.abs(o[2] - xa) < tol);
      if (j >= 0) {
        next.push([open[j][0], y0, xb, y1]);
        open.splice(j, 1);
      } else next.push([xa, y0, xb, y1]);
    }
    out.push(...open);
    open = next;
  }
  out.push(...open);
  return out.filter(([x0, y0, x1, y1]) => x1 - x0 > tol && y1 - y0 > tol);
}

export function convertModel(input: ConvertInput): ConvertResult {
  const et = readEt(input.etText);
  const k = et.units === 'M' ? 1 : et.units === 'CM' ? 0.01 : et.units === 'IN' ? 0.0254 : et.units === 'FT' ? 0.3048 : 0.001; // → metres
  const kmm = k * 1000; // → millimetres
  const skipped = new Map<string, number>();
  const skip = (what: string) => skipped.set(what, (skipped.get(what) ?? 0) + 1);
  const issued = input.issued;
  const sectionOf = (story: string, label: string, fallback?: string) => issued?.get(`${story}|${label}`) ?? fallback;

  // plan centre from every point that carries structure
  const used = new Set<string>();
  for (const a of et.lineAssigns) {
    const l = et.lines[a.name];
    if (l) [l.i, l.j].forEach((p) => used.add(p));
  }
  for (const a of et.areaAssigns) et.areas[a.name]?.pts.forEach((p) => used.add(p));
  const known = [...used].filter((p) => et.points[p]);
  const xs = known.map((p) => et.points[p][0]);
  const ys = known.map((p) => et.points[p][1]);
  const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  const cy = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
  const X = (x: number) => r3((x - cx) * k);
  const Z = (y: number) => r3(-(y - cy) * k);

  // stories top → bottom; the story `off` levels below `story`
  const order = et.stories.map((s) => s.name);
  const zAt = (story: string, off = 0) => {
    const i = order.indexOf(story);
    const s = et.stories[Math.min(order.length - 1, i + off)];
    return r3((s?.z ?? 0) * k);
  };

  const columns: ImportedModelJson['columns'] = [];
  const beams: ImportedModelJson['beams'] = [];
  const sectionsUsed = new Set<string>();
  let changed = 0;
  for (const a of et.lineAssigns) {
    const l = et.lines[a.name];
    if (!l || !a.section || a.section === 'NONE') continue;
    const section = sectionOf(a.story, a.name, a.section)!;
    if (section !== a.section) changed++;
    const p = et.points[l.i];
    const q = et.points[l.j];
    if (!p || !q) continue;
    sectionsUsed.add(section);
    if (l.type === 'COLUMN') columns.push([a.name, a.story, X(p[0]), Z(p[1]), section, r3(a.ang)]);
    else if (l.type === 'BEAM') beams.push([a.name, a.story, X(p[0]), Z(p[1]), X(q[0]), Z(q[1]), section]);
    else skip(l.type === 'BRACE' ? 'Braces' : `${l.type.toLowerCase()} lines`);
  }

  const slabs: ImportedModelJson['slabs'] = [];
  const walls: NonNullable<ImportedModelJson['walls']> = [];
  const inclined: NonNullable<ImportedModelJson['inclined']> = [];
  for (const a of et.areaAssigns) {
    const area = et.areas[a.name];
    if (!area) continue;
    if (a.opening) {
      skip('Openings (not drawn; slabs are drawn whole)');
      continue;
    }
    if (!a.section || a.section === 'NONE') continue;
    const section = sectionOf(a.story, a.name, a.section)!;
    const pts = area.pts.map((p) => et.points[p]);
    if (pts.some((p) => !p)) continue;
    sectionsUsed.add(section);
    if (area.type === 'PANEL') {
      const ys = area.offsets.map((o) => zAt(a.story, o));
      // the two distinct plan points furthest apart are the wall ends
      let best: [number, number] = [0, 1];
      let dmax = -1;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
          if (d > dmax) [dmax, best] = [d, [i, j]];
        }
      const [p1, p2] = [pts[best[0]], pts[best[1]]];
      walls.push([a.name, a.story, section, X(p1[0]), Z(p1[1]), X(p2[0]), Z(p2[1]), Math.min(...ys), Math.max(...ys)]);
      continue;
    }
    if (area.type !== 'FLOOR' && area.type !== 'RAMP') {
      skip(`${area.type.toLowerCase()} areas`);
      continue;
    }
    const tilted = area.type === 'RAMP' || new Set(area.offsets).size > 1;
    if (tilted) {
      inclined.push([a.name, a.story, section, area.type, pts.map((p, i) => [X(p[0]), Z(p[1]), zAt(a.story, area.offsets[i] ?? 0)] as [number, number, number])]);
      continue;
    }
    const px = pts.map((p) => p[0]);
    const py = pts.map((p) => p[1]);
    const rect =
      pts.length === 4 &&
      pts.every((p, i) => {
        const q = pts[(i + 1) % 4];
        return Math.abs(p[0] - q[0]) < 1e-6 || Math.abs(p[1] - q[1]) < 1e-6;
      });
    if (rect) {
      slabs.push([a.name, a.story, section, X(Math.min(...px)), Z(Math.max(...py)), X(Math.max(...px)), Z(Math.min(...py)), 1]);
      continue;
    }
    // any other outline: cut into rectangles (exact for L- and T-shapes, area-exact for slanted edges)
    const parts = rectanglesOf(pts, 0.5 / kmm);
    if (parts.length === 1) {
      slabs.push([a.name, a.story, section, X(Math.min(...px)), Z(Math.max(...py)), X(Math.max(...px)), Z(Math.min(...py)), 1]);
      continue;
    }
    parts.forEach(([x0, y0, x1, y1], i) => slabs.push([`${a.name}.${i + 1}`, a.story, section, X(x0), Z(y1), X(x1), Z(y0), 0]));
  }

  let footings: ImportedModelJson['footings'] = [];
  let straps: ImportedModelJson['straps'] = [];
  let soil: ImportedModelJson['soil'] = null;
  let safe: SafeModel | null = null;
  if (input.safeText) {
    safe = readSafe(input.safeText);
    const ks = k; // SAFE exports in the same unit as the ETABS model in practice; checked below
    const box = (poly: [number, number][]) => {
      const px = poly.map((p) => p[0]);
      const py = poly.map((p) => p[1]);
      return [X(Math.min(...px)), Z(Math.max(...py)), X(Math.max(...px)), Z(Math.min(...py))];
    };
    footings = safe.footings.map((f) => [f.id, r3(f.t * ks), ...f.polys.map(box)]);
    straps = safe.beams.filter((b) => b.i && b.j).map((b) => [X(b.i![0]), Z(b.i![1]), X(b.j![0]), Z(b.j![1]), r3((b.b ?? 200) * ks), r3((b.h ?? 600) * ks)]);
    soil = safe.springs.map((s) => ({ name: s.name, modulus: s.modulus }));
  }

  // sections in millimetres, for models whose names do not carry the sizes
  const frames: Record<string, FrameDims> = {};
  for (const name of sectionsUsed) {
    const f = et.frameSecs[name];
    if (!f) continue;
    const shape = /circle/i.test(f.shape ?? '') ? 'circle' : /concrete rectangular/i.test(f.shape ?? '') ? 'rect' : /steel/i.test(f.shape ?? '') ? 'steel' : 'other';
    const c = et.concSecs[name];
    let bars: FrameDims['bars'];
    if (c && /column/i.test(c.type ?? '')) {
      const pat = c.pattern?.match(/^R-(\d+)-(\d+)$/i);
      const circ = c.pattern?.match(/^C-(\d+)$/i);
      const n = pat ? 2 * (Number(pat[1]) + Number(pat[2])) - 4 : circ ? Number(circ[1]) : c.n3 && c.n2 ? 2 * (c.n3 + c.n2) - 4 : undefined;
      const dia = c.barArea ? barFromArea(c.barArea * kmm * kmm) : c.barSize ? barFromSize(c.barSize) : undefined;
      if (n && dia) bars = { n, dia };
    }
    frames[name] = { shape, h: r3((f.D ?? 0) * kmm), b: r3((f.B ?? f.D ?? 0) * kmm), bars, cover: c?.cover ? r3(c.cover * kmm) : undefined };
  }

  const levels = [...et.stories].reverse().map((s) => ({ name: s.name, z: r3(s.z * k) }));
  const shell: Record<string, ShellProp> = {};
  for (const p of Object.values(et.shellProps)) {
    if (!sectionsUsed.has(p.name)) continue;
    const st = (p.slabType ?? '').toLowerCase();
    const kind: ShellProp['kind'] =
      p.kind === 'Wall' ? 'wall' : st === 'ribbed' ? 'ribbed' : st === 'waffle' ? 'waffle' : st === 'drop' ? 'drop' : st === 'mat' || st === 'footing' ? 'mat' : 'solid';
    const mmOf = (v?: number) => (v === undefined ? undefined : r3(v * kmm));
    shell[p.name] = {
      kind,
      t: mmOf(p.t) ?? 200,
      depth: mmOf(p.depth),
      ribWidth: mmOf(p.ribWidth),
      ribSpacing: mmOf(p.ribSpacing ?? p.ribSpacing1),
      ribAxis: p.ribAxis,
    };
  }

  const concrete = Object.values(et.materials).find((m) => /concrete/i.test(m.type ?? '') && m.fc);
  const rebar = Object.values(et.materials).find((m) => /rebar/i.test(m.type ?? '') && m.fy);
  // stresses → MPa: file force/length units
  const toMPa = (v: number) => (et.force === 'N' && et.units === 'MM' ? v : et.force === 'KN' && et.units === 'M' ? v / 1000 : et.force === 'KN' && et.units === 'MM' ? v * 1000 : et.force === 'N' && et.units === 'M' ? v / 1e6 : v);
  const uniq = (arr: number[]) => [...new Set(arr.filter((v) => Number.isFinite(v)).map((v) => +v.toFixed(4)))];
  // area loads → kPa, line loads → kN/m
  const kpa = (v?: number) => (v === undefined ? NaN : et.units === 'MM' ? (et.force === 'N' ? v * 1000 : v * 1e6) : et.force === 'N' ? v / 1000 : v);
  const knm = (v?: number) => (v === undefined ? NaN : et.units === 'MM' ? (et.force === 'N' ? v : v * 1000) : et.force === 'N' ? v / 1000 : v);
  const patType = (lc?: string) => et.patterns.find((p) => p.name === lc)?.type ?? lc;
  const isDead = (lc?: string) => /dead|super/i.test(patType(lc) ?? '') || lc === 'Dead';
  const isLive = (lc?: string) => /live/i.test(patType(lc) ?? '') || lc === 'Live';

  const json: ImportedModelJson = {
    meta: {
      program: input.source || `${et.program} ${et.version}`.trim(),
      reportDate: null,
      sources: input.fileNames ?? [],
      sectionsFrom: issued ? 'model report' : 'model file',
      sectionsChangedFromModelFile: changed,
      units: et.units,
      code: et.designCode,
    },
    levels,
    columns,
    beams,
    slabs,
    walls,
    inclined,
    footings,
    straps,
    shell,
    frames,
    materials: {
      fc: concrete?.fc ? r3(toMPa(concrete.fc)) : undefined,
      fy: rebar?.fy ? r3(toMPa(rebar.fy)) : undefined,
    },
    loads: {
      wallLinesKNm: uniq(et.loads.line.filter((l) => isDead(l.lc)).map((l) => knm(l.value))),
      superDeadKPa: uniq(et.loads.shell.filter((l) => isDead(l.lc)).map((l) => kpa(l.value))),
      liveKPa: uniq(et.loads.shell.filter((l) => isLive(l.lc)).map((l) => kpa(l.value))),
    },
    soil,
  };
  return { json, et, safe, skipped: [...skipped.entries()].map(([what, count]) => ({ what, count })) };
}
