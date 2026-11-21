#!/usr/bin/env node
// Import a real ETABS (+ SAFE) model into the portfolio's 3D explorer format.
//
//   node scripts/import-etabs.mjs --et "<model.$et or .e2k>" [--report "<Model Report.pdf>"] \
//        [--safe "<foundation.$sf>"] --out src/data/models/<id>.json
//
// Geometry comes from the ETABS text file. When a Model Report PDF is given, member sections are
// taken from it instead (the report is what was issued), keyed by story + object label.
// Footings and strap beams come from the SAFE text file. Output is in metres, plan centred on the
// building, world axes x = ETABS X, z = −ETABS Y (north away from the default camera), y up.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { pdfLines, readEt, readReport, readSafe } from './etabs/readers.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
if (!args.et || !args.out) {
  console.error('usage: node scripts/import-etabs.mjs --et <model.$et> [--report <report.pdf>] [--safe <found.$sf>] --out <file.json>');
  process.exit(1);
}

const et = readEt(readFileSync(args.et, 'utf8'));
const k = et.units === 'M' ? 1 : et.units === 'CM' ? 0.01 : 0.001; // → metres
const report = args.report ? readReport(await pdfLines(args.report)) : null;
const issued = new Map();
if (report) {
  for (const f of report.frames) issued.set(`${f.story}|${f.label}`, f.section);
  for (const a of report.areas) issued.set(`${a.story}|${a.label}`, a.section);
}
const sectionOf = (story, label, fallback) => issued.get(`${story}|${label}`) ?? fallback;

// plan centre from every point that carries structure
const used = new Set();
for (const a of et.lineAssigns) {
  const l = et.lines[a.name];
  if (l) [l.i, l.j].forEach((p) => used.add(p));
}
for (const a of et.areaAssigns) et.areas[a.name]?.pts.forEach((p) => used.add(p));
const xs = [...used].map((p) => et.points[p][0]);
const ys = [...used].map((p) => et.points[p][1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
const r3 = (v) => Math.round(v * 1000) / 1000;
const X = (x) => r3((x - cx) * k);
const Z = (y) => r3(-(y - cy) * k);

const columns = [];
const beams = [];
const sectionsUsed = new Set();
let changed = 0;
for (const a of et.lineAssigns) {
  const l = et.lines[a.name];
  if (!l || !a.section || a.section === 'NONE') continue;
  const section = sectionOf(a.story, a.name, a.section);
  if (section !== a.section) changed++;
  sectionsUsed.add(section);
  const p = et.points[l.i];
  if (l.type === 'COLUMN') columns.push([a.name, a.story, X(p[0]), Z(p[1]), section]);
  else if (l.type === 'BEAM') {
    const q = et.points[l.j];
    beams.push([a.name, a.story, X(p[0]), Z(p[1]), X(q[0]), Z(q[1]), section]);
  }
}

const slabs = [];
for (const a of et.areaAssigns) {
  const area = et.areas[a.name];
  if (!area || area.type !== 'FLOOR' || !a.section) continue;
  const section = sectionOf(a.story, a.name, a.section);
  sectionsUsed.add(section);
  const pts = area.pts.map((p) => et.points[p]);
  const px = pts.map((p) => p[0]);
  const py = pts.map((p) => p[1]);
  slabs.push([a.name, a.story, section, X(Math.min(...px)), Z(Math.max(...py)), X(Math.max(...px)), Z(Math.min(...py))]);
}

let footings = [];
let straps = [];
let soil = null;
if (args.safe) {
  const safe = readSafe(readFileSync(args.safe, 'utf8'));
  const box = (poly) => {
    const px = poly.map((p) => p[0]);
    const py = poly.map((p) => p[1]);
    return [X(Math.min(...px)), Z(Math.max(...py)), X(Math.max(...px)), Z(Math.min(...py))];
  };
  // a footing drawn as an outline with a hole (wall strip) keeps both rectangles
  footings = safe.footings.map((f) => [f.id, r3(f.t * k), ...f.polys.map(box)]);
  straps = safe.beams.filter((b) => b.i && b.j).map((b) => [X(b.i[0]), Z(b.i[1]), X(b.j[0]), Z(b.j[1]), r3((b.b ?? 200) * k), r3((b.h ?? 600) * k)]);
  soil = safe.springs.map((s) => ({ name: s.name, modulus: s.modulus }));
}

const levels = [...et.stories].reverse().map((s) => ({ name: s.name, z: r3(s.z * k) }));
const shell = Object.fromEntries(
  Object.values(et.shellProps)
    .filter((p) => sectionsUsed.has(p.name))
    .map((p) => [p.name, { kind: p.slabType === 'Ribbed' ? 'ribbed' : 'solid', t: p.t, depth: p.depth, ribWidth: p.ribWidth, ribSpacing: p.ribSpacing, ribAxis: p.ribAxis }]),
);

const uniq = (arr) => [...new Set(arr.map((v) => +v.toFixed(4)))];
const kpa = (v) => (et.units === 'MM' ? v * 1000 : v); // N/mm² → kPa; kN/m² already
const knm = (v) => (et.units === 'MM' ? v : v); // N/mm = kN/m
const out = {
  meta: {
    program: report?.program || `${et.program} ${et.version}`,
    reportDate: report?.date || null,
    sources: [args.et, args.report, args.safe].filter(Boolean).map((p) => basename(p)),
    sectionsFrom: report ? 'model report' : 'model file',
    sectionsChangedFromModelFile: changed,
    importedAt: new Date().toISOString().slice(0, 10),
  },
  levels,
  columns,
  beams,
  slabs,
  footings,
  straps,
  shell,
  loads: {
    wallLinesKNm: uniq(et.loads.line.filter((l) => l.lc === 'Dead').map((l) => knm(l.value))),
    superDeadKPa: uniq(et.loads.shell.filter((l) => l.lc === 'Dead').map((l) => kpa(l.value))),
    liveKPa: uniq(et.loads.shell.filter((l) => l.lc === 'Live').map((l) => kpa(l.value))),
  },
  soil,
};
mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(args.out, JSON.stringify(out));
console.log(
  `wrote ${args.out}: ${columns.length} column segments, ${beams.length} beams, ${slabs.length} slab panels, ${footings.length} footings, ${straps.length} strap beams; ` +
    `${changed} sections taken from the report`,
);
