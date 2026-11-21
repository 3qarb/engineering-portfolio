// Readers for CSI text exports used by scripts/import-etabs.mjs.
//   readEt(text)        ETABS .$et / .e2k model text (any units; returned in the file's length unit)
//   readReport(lines)   text of an ETABS "Model Report" PDF (lengths in m) — issued sections
//   readSafe(text)      SAFE .$sf / .f2k table text — footings and strap beams
//   pdfLines(path)      text of a PDF, line by line (needs the dev dependency pdfjs-dist)
import { readFileSync } from 'node:fs';

const tok = (s) => [...s.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
const kv = (t, key) => {
  const i = t.indexOf(key);
  return i >= 0 ? t[i + 1] : undefined;
};
const num = (v) => (v === undefined ? undefined : Number(v));

export function readEt(text) {
  const m = { units: 'MM', program: '', version: '', stories: [], points: {}, lines: {}, areas: {}, lineAssigns: [], areaAssigns: [], frameSecs: {}, concSecs: {}, shellProps: {}, materials: {}, loads: { line: [], shell: [] }, seismic: [], wind: [], combos: {} };
  let section = '';
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    if (raw.startsWith('$ ')) { section = raw.slice(2).trim(); continue; }
    const s = raw.trim();
    if (!s) continue;
    const t = tok(s);
    switch (section) {
      case 'PROGRAM INFORMATION': m.program = kv(t, 'PROGRAM'); m.version = kv(t, 'VERSION'); break;
      case 'CONTROLS': if (t[0] === 'UNITS') m.units = t[2]; break;
      case 'STORIES - IN SEQUENCE FROM TOP': m.stories.push({ name: t[1], height: num(kv(t, 'HEIGHT')) ?? 0, elev: num(kv(t, 'ELEV')) }); break;
      case 'MATERIAL PROPERTIES': {
        const x = (m.materials[t[1]] ??= {});
        if (kv(t, 'TYPE')) x.type = kv(t, 'TYPE');
        if (kv(t, 'FC')) x.fc = num(kv(t, 'FC'));
        if (kv(t, 'FY')) x.fy = num(kv(t, 'FY'));
        break;
      }
      case 'FRAME SECTIONS': {
        const f = (m.frameSecs[t[1]] ??= { name: t[1] });
        if (kv(t, 'SHAPE')) Object.assign(f, { material: kv(t, 'MATERIAL'), shape: kv(t, 'SHAPE'), D: num(kv(t, 'D')), B: num(kv(t, 'B')) });
        break;
      }
      case 'CONCRETE SECTIONS': m.concSecs[t[1]] = { type: kv(t, 'TYPE'), cover: num(kv(t, 'COVER') ?? kv(t, 'COVERTOP')) }; break;
      case 'SLAB PROPERTIES':
      case 'WALL PROPERTIES': {
        const p = (m.shellProps[t[1]] ??= { name: t[1] });
        if (kv(t, 'PROPTYPE')) Object.assign(p, { kind: kv(t, 'PROPTYPE'), slabType: kv(t, 'SLABTYPE'), t: num(kv(t, 'SLABTHICKNESS') ?? kv(t, 'WALLTHICKNESS')), depth: num(kv(t, 'OVERALLDEPTH')), ribWidth: num(kv(t, 'SLABRIBWIDTHTOP')), ribSpacing: num(kv(t, 'SLABRIBSPACING')), ribAxis: num(kv(t, 'SLABRIBPARALLELTOAXIS')) });
        break;
      }
      case 'POINT COORDINATES': m.points[t[1]] = [Number(t[2]), Number(t[3])]; break;
      case 'LINE CONNECTIVITIES': m.lines[t[1]] = { type: t[2], i: t[3], j: t[4] }; break;
      case 'AREA CONNECTIVITIES': m.areas[t[1]] = { type: t[2], pts: t.slice(4, 4 + Number(t[3])) }; break;
      case 'LINE ASSIGNS': m.lineAssigns.push({ name: t[1], story: t[2], section: kv(t, 'SECTION'), ang: num(kv(t, 'ANG')) ?? 0 }); break;
      case 'AREA ASSIGNS': m.areaAssigns.push({ name: t[1], story: t[2], section: kv(t, 'SECTION') }); break;
      case 'LOAD PATTERNS':
        if (t[0] === 'SEISMIC') m.seismic.push({ name: t[1], coeff: num(kv(t, 'SHEARCOEFF')), k: num(kv(t, 'HEIGHTEXPONENT')) });
        if (t[0] === 'WIND') m.wind.push({ name: t[1], code: t[2], speed: num(kv(t, 'SPEED')), exposure: kv(t, 'EXPOSURE') });
        break;
      case 'FRAME OBJECT LOADS': m.loads.line.push({ name: t[1], story: t[2], lc: kv(t, 'LC'), value: num(kv(t, 'FVAL')) }); break;
      case 'SHELL OBJECT LOADS': m.loads.shell.push({ name: t[1], story: t[2], lc: kv(t, 'LC'), value: num(kv(t, 'FVAL') ?? kv(t, 'VALUE')) }); break;
      case 'LOAD COMBINATIONS': {
        const c = (m.combos[t[1]] ??= { name: t[1], terms: [] });
        if (kv(t, 'SF')) c.terms.push([Number(kv(t, 'SF')), kv(t, 'LOADCASE') ?? kv(t, 'LOADCOMBO')]);
        break;
      }
    }
  }
  // story elevations, bottom up
  const up = [...m.stories].reverse();
  let z = 0;
  for (const s of up) {
    z = s.elev !== undefined ? s.elev : z + s.height;
    s.z = z;
  }
  m.storyZ = Object.fromEntries(up.map((s) => [s.name, s.z]));
  return m;
}

/** Issued sections from an ETABS Model Report (Tables 1.1, 3.2 and 3.3). */
export function readReport(lines) {
  const out = { program: '', date: '', frames: [], areas: [], stories: [] };
  let table = '';
  for (const line of lines) {
    const v = line.match(/^(ETABS v[\d.]+)/);
    if (v) out.program = v[1];
    if (!out.date && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(line)) out.date = line;
    const t = line.match(/^Table (\d+\.\d+) - /);
    if (t) { table = t[1]; continue; }
    if (table === '1.1') {
      const m = line.match(/^T1 (\S+) ([\d.]+) /);
      if (m) out.stories.push({ name: m[1], height: Number(m[2]) });
    } else if (table === '3.2') {
      const m = line.match(/^(\S+) (\S+) (\d+) (Column|Beam|Brace) ([\d.]+) ((?:COL|B|BEAM) \S+(?: [HV] \d+T\d+)?) /);
      if (m) out.frames.push({ story: m[1], label: m[2], type: m[4], section: m[6] });
    } else if (table === '3.3') {
      const m = line.match(/^(\S+) (\S+) (\d+) (.+) (Slab|Wall|Deck)$/);
      if (m) out.areas.push({ story: m[1], label: m[2], section: m[4] });
    }
  }
  return out;
}

/** SAFE table text: footing outlines (property type Footing) and frame objects. */
export function readSafe(text) {
  const rows = (name) => {
    const res = [];
    let on = false;
    let buf = '';
    for (const raw of text.replace(/\r/g, '').split('\n')) {
      if (raw.startsWith('TABLE:')) { on = raw.includes(`"${name}"`); continue; }
      if (!on) continue;
      buf += ` ${raw.trim().replace(/ _$/, '')}`;
      if (!raw.trimEnd().endsWith('_')) { if (buf.trim()) res.push(buf.trim()); buf = ''; }
    }
    return res;
  };
  const val = (l, k) => {
    const m = l.match(new RegExp(`(?:"${k}"|\\b${k})=("([^"]*)"|\\S+)`));
    return m ? (m[2] ?? m[1]) : undefined;
  };
  const pts = {};
  for (const l of rows('POINT OBJECT CONNECTIVITY')) pts[val(l, 'UniqueName')] = [Number(val(l, 'X')), Number(val(l, 'Y'))];
  const slabProps = {};
  for (const l of rows('SLAB PROPERTY DEFINITIONS')) slabProps[val(l, 'Name')] = { type: val(l, 'Property Type'), t: Number(val(l, 'Slab Thickness')) };
  const areaProp = {};
  for (const l of rows('AREA ASSIGNMENTS - SECTION PROPERTIES')) areaProp[val(l, 'UniqueName')] = val(l, 'Section Property');
  const footings = [];
  const groups = new Map();
  for (const l of rows('FLOOR OBJECT CONNECTIVITY')) {
    const id = val(l, 'Unique Name');
    const ids = [...l.matchAll(/UniquePt\d+=(\S+)/g)].map((m) => m[1]);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(ids.map((i) => pts[i]).filter(Boolean));
  }
  for (const [id, polys] of groups) {
    const prop = slabProps[areaProp[id]];
    if (!prop || prop.type !== 'Footing') continue;
    footings.push({ id, t: prop.t, polys });
  }
  const frameSec = {};
  for (const l of rows('FRAME ASSIGNMENTS - SECTION PROPERTIES')) frameSec[val(l, 'UniqueName')] = val(l, 'Section Property');
  const secDims = {};
  for (const l of rows('FRAME SECTION PROPERTY DEFINITIONS - CONCRETE RECTANGULAR')) secDims[val(l, 'Name')] = { b: Number(val(l, 'Width')), h: Number(val(l, 'Depth')) };
  const beams = [];
  for (const l of rows('BEAM OBJECT CONNECTIVITY')) {
    const id = val(l, 'Unique Name');
    const s = frameSec[id];
    beams.push({ id, i: pts[val(l, 'UniquePtI')], j: pts[val(l, 'UniquePtJ')], section: s, ...(secDims[s] ?? {}) });
  }
  const springs = rows('SPRING PROPERTY DEFINITIONS - AREA SPRINGS').map((l) => ({ name: val(l, 'Name'), modulus: Number(val(l, 'Subgrade Modulus')) }));
  return { footings, beams, springs };
}

export async function pdfLines(path) {
  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    throw new Error('Reading a PDF report needs the dev dependency: npm install -D pdfjs-dist');
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), useSystemFonts: true }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    const rows = new Map();
    for (const it of tc.items) {
      const y = Math.round(it.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: it.transform[4], s: it.str });
    }
    for (const [, r] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
      const line = r.sort((a, b) => a.x - b.x).map((c) => c.s).join(' ').replace(/\s+/g, ' ').trim();
      if (line) out.push(line);
    }
  }
  return out;
}
