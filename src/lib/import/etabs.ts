// Readers for CSI text exports, shared by the browser (the Add-project page) and the Node script
// (scripts/import-etabs.mjs). No DOM or Node APIs here, and only type imports from outside this
// folder, so Node can load the file directly.
//   readEt(text)    ETABS .$et / .e2k model text (lengths in the file's unit)
//   readSafe(text)  SAFE .$sf / .f2k table text: footings, strap beams, soil springs

export type Tokens = string[];

export const tok = (s: string): Tokens => [...s.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
export const kv = (t: Tokens, key: string): string | undefined => {
  const i = t.indexOf(key);
  return i >= 0 ? t[i + 1] : undefined;
};
const num = (v: string | undefined) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v));

export interface EtStory {
  name: string;
  height: number;
  elev?: number;
  /** Elevation, bottom up, in file units */
  z: number;
}
export interface EtFrameSec {
  name: string;
  material?: string;
  shape?: string;
  D?: number;
  B?: number;
}
export interface EtConcSec {
  type?: string;
  cover?: number;
  pattern?: string;
  n3?: number;
  n2?: number;
  barArea?: number;
  barSize?: string;
}
export interface EtShellProp {
  name: string;
  kind?: string;
  slabType?: string;
  material?: string;
  t?: number;
  depth?: number;
  ribWidth?: number;
  ribSpacing?: number;
  ribAxis?: number;
  ribSpacing1?: number;
  ribSpacing2?: number;
  stemWidth?: number;
}
export interface EtModel {
  units: string;
  /** Force unit */
  force: string;
  program: string;
  version: string;
  title: string;
  stories: EtStory[];
  points: Record<string, [number, number]>;
  lines: Record<string, { type: string; i: string; j: string; offI: number; offJ: number }>;
  areas: Record<string, { type: string; pts: string[]; offsets: number[] }>;
  lineAssigns: { name: string; story: string; section?: string; ang: number }[];
  areaAssigns: { name: string; story: string; section?: string; opening: boolean }[];
  frameSecs: Record<string, EtFrameSec>;
  concSecs: Record<string, EtConcSec>;
  shellProps: Record<string, EtShellProp>;
  materials: Record<string, { type?: string; fc?: number; fy?: number }>;
  loads: { line: { name: string; story: string; lc?: string; value?: number }[]; shell: { name: string; story: string; lc?: string; value?: number }[] };
  patterns: { name: string; type?: string }[];
  seismic: { name: string; coeff?: number; k?: number }[];
  wind: { name: string; code?: string; speed?: number; exposure?: string }[];
  combos: Record<string, { name: string; terms: [number, string | undefined][] }>;
  restraints: number;
  designCode?: string;
  storyZ: Record<string, number>;
}

export function readEt(text: string): EtModel {
  const m: EtModel = {
    units: 'MM',
    force: 'N',
    program: '',
    version: '',
    title: '',
    stories: [],
    points: {},
    lines: {},
    areas: {},
    lineAssigns: [],
    areaAssigns: [],
    frameSecs: {},
    concSecs: {},
    shellProps: {},
    materials: {},
    loads: { line: [], shell: [] },
    patterns: [],
    seismic: [],
    wind: [],
    combos: {},
    restraints: 0,
    storyZ: {},
  };
  let section = '';
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    if (raw.startsWith('$ ')) {
      section = raw.slice(2).trim();
      continue;
    }
    const s = raw.trim();
    if (!s) continue;
    const t = tok(s);
    switch (section) {
      case 'PROGRAM INFORMATION':
        m.program = kv(t, 'PROGRAM') ?? '';
        m.version = kv(t, 'VERSION') ?? '';
        break;
      case 'CONTROLS':
        if (t[0] === 'UNITS') {
          m.force = t[1];
          m.units = t[2];
        }
        if (t[0] === 'TITLE2') m.title = t[1];
        break;
      case 'STORIES - IN SEQUENCE FROM TOP':
        m.stories.push({ name: t[1], height: num(kv(t, 'HEIGHT')) ?? 0, elev: num(kv(t, 'ELEV')), z: 0 });
        break;
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
      case 'CONCRETE SECTIONS':
        m.concSecs[t[1]] = {
          type: kv(t, 'TYPE'),
          cover: num(kv(t, 'COVER') ?? kv(t, 'COVERTOP')),
          pattern: kv(t, 'PATTERN'),
          n3: num(kv(t, 'NUMBARS3DIR')),
          n2: num(kv(t, 'NUMBARS2DIR')),
          barArea: num(kv(t, 'LONGBARAREA')),
          barSize: kv(t, 'BARSIZE') ?? kv(t, 'LONGBARSIZE'),
        };
        break;
      case 'SLAB PROPERTIES':
      case 'WALL PROPERTIES':
      case 'DECK PROPERTIES': {
        const p = (m.shellProps[t[1]] ??= { name: t[1] });
        if (kv(t, 'PROPTYPE')) {
          // waffle keys differ between versions: take any key that names a rib spacing / stem width
          const find = (re: RegExp) => {
            for (let i = 2; i < t.length - 1; i++) if (re.test(t[i])) return num(t[i + 1]);
            return undefined;
          };
          Object.assign(p, {
            kind: kv(t, 'PROPTYPE'),
            slabType: kv(t, 'SLABTYPE'),
            material: kv(t, 'MATERIAL'),
            t: num(kv(t, 'SLABTHICKNESS') ?? kv(t, 'WALLTHICKNESS') ?? kv(t, 'DECKSLABDEPTH')),
            depth: num(kv(t, 'OVERALLDEPTH')),
            ribWidth: num(kv(t, 'SLABRIBWIDTHTOP') ?? kv(t, 'STEMWIDTHTOP')) ?? find(/STEMWIDTH|RIBWIDTH/),
            ribSpacing: num(kv(t, 'SLABRIBSPACING')),
            ribAxis: num(kv(t, 'SLABRIBPARALLELTOAXIS')),
            ribSpacing1: find(/SPACING.*1$|SPACINGDIR1|RIBSPACING1/),
            ribSpacing2: find(/SPACING.*2$|SPACINGDIR2|RIBSPACING2/),
          });
        }
        break;
      }
      case 'POINT COORDINATES':
        m.points[t[1]] = [Number(t[2]), Number(t[3])];
        break;
      case 'LINE CONNECTIVITIES':
        m.lines[t[1]] = { type: t[2], i: t[3], j: t[4], offI: num(t[5]) ?? 0, offJ: num(t[6]) ?? 0 };
        break;
      case 'AREA CONNECTIVITIES': {
        const n = Number(t[3]);
        m.areas[t[1]] = { type: t[2], pts: t.slice(4, 4 + n), offsets: t.slice(4 + n, 4 + 2 * n).map((v) => Number(v) || 0) };
        break;
      }
      case 'POINT ASSIGNS':
        if (kv(t, 'RESTRAINT')) m.restraints++;
        break;
      case 'LINE ASSIGNS':
        m.lineAssigns.push({ name: t[1], story: t[2], section: kv(t, 'SECTION'), ang: num(kv(t, 'ANG')) ?? 0 });
        break;
      case 'AREA ASSIGNS':
        m.areaAssigns.push({ name: t[1], story: t[2], section: kv(t, 'SECTION'), opening: (kv(t, 'OPENING') ?? '').toLowerCase() === 'yes' });
        break;
      case 'LOAD PATTERNS':
        if (t[0] === 'LOADPATTERN') m.patterns.push({ name: t[1], type: kv(t, 'TYPE') });
        if (t[0] === 'SEISMIC') m.seismic.push({ name: t[1], coeff: num(kv(t, 'SHEARCOEFF')), k: num(kv(t, 'HEIGHTEXPONENT')) });
        if (t[0] === 'WIND') m.wind.push({ name: t[1], code: t[2], speed: num(kv(t, 'SPEED')), exposure: kv(t, 'EXPOSURE') });
        break;
      case 'FRAME OBJECT LOADS':
        m.loads.line.push({ name: t[1], story: t[2], lc: kv(t, 'LC'), value: num(kv(t, 'FVAL')) });
        break;
      case 'SHELL OBJECT LOADS':
        m.loads.shell.push({ name: t[1], story: t[2], lc: kv(t, 'LC'), value: num(kv(t, 'FVAL') ?? kv(t, 'VALUE')) });
        break;
      case 'LOAD COMBINATIONS': {
        const c = (m.combos[t[1]] ??= { name: t[1], terms: [] });
        if (kv(t, 'SF')) c.terms.push([Number(kv(t, 'SF')), kv(t, 'LOADCASE') ?? kv(t, 'LOADCOMBO')]);
        break;
      }
      case 'CONCRETE DESIGN PREFERENCES':
        if (kv(t, 'CODE')) m.designCode = kv(t, 'CODE');
        break;
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

export interface SafeModel {
  footings: { id: string; t: number; polys: [number, number][][] }[];
  beams: { id: string; i?: [number, number]; j?: [number, number]; section?: string; b?: number; h?: number }[];
  springs: { name: string; modulus: number }[];
  units?: string;
}

/** SAFE table text: footing outlines (property type Footing) and frame objects. */
export function readSafe(text: string): SafeModel {
  const lines = text.replace(/\r/g, '').split('\n');
  const rows = (name: string) => {
    const res: string[] = [];
    let on = false;
    let buf = '';
    for (const raw of lines) {
      if (raw.startsWith('TABLE:')) {
        on = raw.includes(`"${name}"`);
        continue;
      }
      if (!on) continue;
      buf += ` ${raw.trim().replace(/ _$/, '')}`;
      if (!raw.trimEnd().endsWith('_')) {
        if (buf.trim()) res.push(buf.trim());
        buf = '';
      }
    }
    return res;
  };
  const val = (l: string, k: string) => {
    const m = l.match(new RegExp(`(?:"${k}"|\\b${k})=("([^"]*)"|\\S+)`));
    return m ? (m[2] ?? m[1]) : undefined;
  };
  const pts: Record<string, [number, number]> = {};
  for (const l of rows('POINT OBJECT CONNECTIVITY')) pts[val(l, 'UniqueName')!] = [Number(val(l, 'X')), Number(val(l, 'Y'))];
  const slabProps: Record<string, { type?: string; t: number }> = {};
  for (const l of rows('SLAB PROPERTY DEFINITIONS')) slabProps[val(l, 'Name')!] = { type: val(l, 'Property Type'), t: Number(val(l, 'Slab Thickness')) };
  const areaProp: Record<string, string | undefined> = {};
  for (const l of rows('AREA ASSIGNMENTS - SECTION PROPERTIES')) areaProp[val(l, 'UniqueName')!] = val(l, 'Section Property');
  const footings: SafeModel['footings'] = [];
  const groups = new Map<string, [number, number][][]>();
  for (const l of rows('FLOOR OBJECT CONNECTIVITY')) {
    const id = val(l, 'Unique Name')!;
    const ids = [...l.matchAll(/UniquePt\d+=(\S+)/g)].map((m) => m[1]);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(ids.map((i) => pts[i]).filter(Boolean));
  }
  for (const [id, polys] of groups) {
    const prop = slabProps[areaProp[id] ?? ''];
    if (!prop || (prop.type !== 'Footing' && prop.type !== 'Mat')) continue;
    footings.push({ id, t: prop.t, polys });
  }
  const frameSec: Record<string, string | undefined> = {};
  for (const l of rows('FRAME ASSIGNMENTS - SECTION PROPERTIES')) frameSec[val(l, 'UniqueName')!] = val(l, 'Section Property');
  const secDims: Record<string, { b: number; h: number }> = {};
  for (const l of rows('FRAME SECTION PROPERTY DEFINITIONS - CONCRETE RECTANGULAR')) secDims[val(l, 'Name')!] = { b: Number(val(l, 'Width')), h: Number(val(l, 'Depth')) };
  const beams: SafeModel['beams'] = [];
  for (const l of rows('BEAM OBJECT CONNECTIVITY')) {
    const id = val(l, 'Unique Name')!;
    const s = frameSec[id];
    beams.push({ id, i: pts[val(l, 'UniquePtI')!], j: pts[val(l, 'UniquePtJ')!], section: s, ...(s ? secDims[s] : {}) });
  }
  const springs = rows('SPRING PROPERTY DEFINITIONS - AREA SPRINGS').map((l) => ({ name: val(l, 'Name') ?? '', modulus: Number(val(l, 'Subgrade Modulus')) }));
  const unitsRow = rows('PROGRAM CONTROL')[0];
  return { footings, beams, springs, units: unitsRow ? val(unitsRow, 'CurrUnits') : undefined };
}

/** What a dropped file is, from its name and first lines. */
export type FileRole = 'etabs' | 'safe' | 'binary-etabs' | 'binary-safe' | 'drawing' | 'unknown';

export function detectRole(name: string, head = ''): FileRole {
  const n = name.toLowerCase();
  if (/\.(\$et|e2k)$/.test(n)) return 'etabs';
  if (/\.(\$sf|f2k)$/.test(n)) return 'safe';
  if (/\.edb$/.test(n)) return 'binary-etabs';
  if (/\.fdb$/.test(n)) return 'binary-safe';
  if (/\.(dwg|dxf|pdf)$/.test(n)) return 'drawing';
  if (/\$ PROGRAM INFORMATION|\$ STORIES - IN SEQUENCE FROM TOP/.test(head)) return 'etabs';
  if (/TABLE:\s+"PROGRAM CONTROL"/.test(head) && /SAFE/i.test(head)) return 'safe';
  return 'unknown';
}
