import { describe, expect, it } from 'vitest';
import { elementTypes } from '../src/data/elements';
import { toolsAr, toolsEn } from '../src/i18n/tools';
import { runChecks, tally } from '../src/lib/import/checks';
import { convertModel, rectanglesOf } from '../src/lib/import/convert';
import { detectRole } from '../src/lib/import/etabs';
import { blockCount, byType, takeoff, takeoffCsv, totals, DEFAULT_RATES } from '../src/lib/import/takeoff';
import { understand } from '../src/lib/import/understand';
import { buildImported } from '../src/lib/structure/imported';
import { cageFor } from '../src/lib/structure/rebar';
import { quantities, sectionFacts } from '../src/lib/structure/sectionMath';

/** A small two-storey block in ETABS text format: frame, ribbed floor, solid roof, a wall and a ramp. */
const E2K = `$ PROGRAM INFORMATION
  PROGRAM  "ETABS"  VERSION "21.0.0"

$ CONTROLS
  UNITS  "N"  "MM"  "C"
  TITLE2  "Test block"

$ STORIES - IN SEQUENCE FROM TOP
  STORY "Roof"  HEIGHT 3000
  STORY "First"  HEIGHT 3200
  STORY "Base"  ELEV 0

$ MATERIAL PROPERTIES
  MATERIAL  "C30"  TYPE "Concrete"  FC 30
  MATERIAL  "A615"  TYPE "Rebar"  FY 420

$ FRAME SECTIONS
  FRAMESECTION  "C30X60"  MATERIAL "C30"  SHAPE "Concrete Rectangular"  D 600  B 300
  FRAMESECTION  "CC50"  MATERIAL "C30"  SHAPE "Concrete Circle"  D 500
  FRAMESECTION  "B30X60"  MATERIAL "C30"  SHAPE "Concrete Rectangular"  D 600  B 300

$ CONCRETE SECTIONS
  CONCRETESECTION  "C30X60"  TYPE "Column"  COVER 40  PATTERN "R-3-3"  LONGBARAREA 314.2
  CONCRETESECTION  "CC50"  TYPE "Column"  COVER 40  PATTERN "C-8"  LONGBARAREA 201.1
  CONCRETESECTION  "B30X60"  TYPE "Beam"  COVERTOP 40

$ SLAB PROPERTIES
  SHELLPROP  "RIB32"  PROPTYPE "Slab"  MATERIAL "C30"  SLABTYPE "Ribbed"  OVERALLDEPTH 320  SLABTHICKNESS 70  SLABRIBWIDTHTOP 150  SLABRIBSPACING 550  SLABRIBPARALLELTOAXIS 1
  SHELLPROP  "S200"  PROPTYPE "Slab"  MATERIAL "C30"  SLABTYPE "Slab"  SLABTHICKNESS 200

$ WALL PROPERTIES
  SHELLPROP  "W250"  PROPTYPE "Wall"  MATERIAL "C30"  WALLTHICKNESS 250

$ POINT COORDINATES
  POINT "1"  0  0
  POINT "2"  6000  0
  POINT "3"  6000  5000
  POINT "4"  0  5000
  POINT "5"  26000  0
  POINT "6"  26000  5000
  POINT "7"  0  10333
  POINT "8"  1200  10333
  POINT "9"  1200  5000

$ LINE CONNECTIVITIES
  LINE  "C1"  COLUMN  "1"  "1"  1
  LINE  "C2"  COLUMN  "2"  "2"  1
  LINE  "C3"  COLUMN  "3"  "3"  1
  LINE  "C4"  COLUMN  "4"  "4"  1
  LINE  "B1"  BEAM  "1"  "2"  0
  LINE  "B2"  BEAM  "2"  "3"  0
  LINE  "B3"  BEAM  "3"  "4"  0
  LINE  "B4"  BEAM  "4"  "1"  0

$ AREA CONNECTIVITIES
  AREA "F1"  FLOOR  4  "1"  "2"  "3"  "4"  0  0  0  0
  AREA "W1"  PANEL  4  "1"  "4"  "4"  "1"  0  0  1  1
  AREA "R1"  RAMP  4  "2"  "5"  "6"  "3"  0  1  1  0
  AREA "S1"  RAMP  4  "4"  "9"  "8"  "7"  0  0  1  1

$ POINT ASSIGNS
  POINTASSIGN  "1"  "Base"  RESTRAINT "UX UY UZ"

$ LINE ASSIGNS
  LINEASSIGN  "C1"  "First"  SECTION "C30X60"
  LINEASSIGN  "C2"  "First"  SECTION "C30X60"
  LINEASSIGN  "C3"  "First"  SECTION "CC50"
  LINEASSIGN  "C4"  "First"  SECTION "C30X60"
  LINEASSIGN  "C1"  "Roof"  SECTION "C30X60"
  LINEASSIGN  "C2"  "Roof"  SECTION "C30X60"
  LINEASSIGN  "C3"  "Roof"  SECTION "CC50"
  LINEASSIGN  "C4"  "Roof"  SECTION "C30X60"
  LINEASSIGN  "B1"  "First"  SECTION "B30X60"
  LINEASSIGN  "B2"  "First"  SECTION "B30X60"
  LINEASSIGN  "B3"  "First"  SECTION "B30X60"
  LINEASSIGN  "B4"  "First"  SECTION "B30X60"
  LINEASSIGN  "B1"  "Roof"  SECTION "B30X60"
  LINEASSIGN  "B2"  "Roof"  SECTION "B30X60"
  LINEASSIGN  "B3"  "Roof"  SECTION "B30X60"
  LINEASSIGN  "B4"  "Roof"  SECTION "B30X60"

$ AREA ASSIGNS
  AREAASSIGN  "F1"  "First"  SECTION "RIB32"
  AREAASSIGN  "F1"  "Roof"  SECTION "S200"
  AREAASSIGN  "W1"  "First"  SECTION "W250"
  AREAASSIGN  "R1"  "First"  SECTION "S200"
  AREAASSIGN  "S1"  "First"  SECTION "S200"

$ LOAD PATTERNS
  LOADPATTERN "Dead"  TYPE  "Dead"  SELFWEIGHT  1
  LOADPATTERN "Live"  TYPE  "Live"  SELFWEIGHT  0

$ SHELL OBJECT LOADS
  SHELLUNIFORMLOAD  "F1"  "First"  LC "Live"  FVAL 0.002

$ LOAD COMBINATIONS
  COMBO "U1"  TYPE "Linear Add"
  COMBO "U1"  LOADCASE "Dead"  SF 1.4

$ CONCRETE DESIGN PREFERENCES
  CONCRETEPREFERENCE  CODE "ACI 318-19"
`;

const conv = convertModel({ etText: E2K, fileNames: ['test.e2k'] });
const built = buildImported(conv.json);
const els = built.elements;
const types = new Set(els.map((e) => e.typeId));

describe('model reader', () => {
  it('recognises an ETABS text file and not a drawing', () => {
    expect(detectRole('block.e2k', E2K.slice(0, 400))).toBe('etabs');
    expect(detectRole('block.EDB', '')).toBe('binary-etabs');
    expect(detectRole('plan.dwg', '')).toBe('drawing');
  });

  it('reads stories, materials and the design code', () => {
    expect(conv.json.levels.map((l) => [l.name, l.z])).toEqual([
      ['Base', 0],
      ['First', 3.2],
      ['Roof', 6.2],
    ]);
    expect(conv.json.materials).toMatchObject({ fc: 30, fy: 420 });
    expect(conv.json.meta.code).toBe('ACI 318-19');
  });

  it('reads column bars from the section pattern and the shape from the frame section', () => {
    expect(conv.json.frames?.C30X60).toMatchObject({ shape: 'rect', b: 300, h: 600, bars: { n: 8, dia: 20 } });
    expect(conv.json.frames?.CC50).toMatchObject({ shape: 'circle', bars: { n: 8, dia: 16 } });
  });

  it('types every member for the library', () => {
    for (const id of ['column-rect', 'column-circle', 'ribbed-slab', 'solid-slab', 'rc-wall', 'ramp', 'stair']) expect(types, id).toContain(id);
    expect(els.filter((e) => e.kind === 'column')).toHaveLength(8);
    expect(els.filter((e) => e.kind === 'beam')).toHaveLength(8);
    expect(els.every((e) => e.typeId)).toBe(true);
  });

  it('pitches the ramp between the two levels', () => {
    const ramp = els.find((e) => e.kind === 'ramp')!;
    expect(ramp.section.kind).toBe('ramp');
    if (ramp.section.kind === 'ramp') expect(ramp.section.slope).toBeCloseTo(16, 0);
  });

  it('writes a project brief', () => {
    const brief = understand(conv, els, built.bounds);
    expect(brief.stories.map((s) => s.name)).toEqual(["First", "Roof"]);
    // footprint includes the turned stair and the pitched ramp
    expect(brief.footprint.w).toBeGreaterThan(26);
    expect(brief.footprint.w).toBeLessThan(26.5);
    expect(brief.footprint.d).toBeGreaterThan(10.3);
    expect(brief.footprint.d).toBeLessThan(10.8);
    expect(brief.combos).toBe(1);
    expect(brief.loads.liveKPa).toContain(2);
    expect(brief.system.en).toMatch(/ribbed/);
    expect(brief.system.ar.length).toBeGreaterThan(10);
  });
});

describe('rectangles from slab outlines', () => {
  it('keeps a rectangle whole and splits an L into two', () => {
    expect(rectanglesOf([[0, 0], [4, 0], [4, 3], [0, 3]])).toHaveLength(1);
    const L = rectanglesOf([[0, 0], [6, 0], [6, 2], [2, 2], [2, 5], [0, 5]]);
    expect(L.reduce((a, [x0, y0, x1, y1]) => a + (x1 - x0) * (y1 - y0), 0)).toBeCloseTo(6 * 2 + 2 * 3);
  });

  it('merges near-equal vertices within the tolerance', () => {
    expect(rectanglesOf([[0, 0], [3150.0002, 0], [3150.0005, 2000], [0, 2000]], 0.5)).toHaveLength(1);
  });
});

describe('checker', () => {
  const rules = runChecks(conv.json, els, 1);
  it('runs the rules and checks members', () => {
    const n = tally(rules);
    expect(n.rules).toBeGreaterThan(5);
    expect(n.checked).toBeGreaterThan(10);
    for (const r of rules) for (const f of r.findings) expect(f.detail.ar.length, r.id).toBeGreaterThan(0);
  });

  it('flags a ramp steeper than 1:12 for review or failure', () => {
    const findings = rules.flatMap((r) => r.findings).filter((f) => /steep for vehicles/.test(f.detail.en));
    expect(findings.length).toBeGreaterThan(0);
  });
});

describe('builder: quantity take-off', () => {
  const rows = takeoff(els);
  it('measures concrete, formwork, steel and blocks', () => {
    const t = totals(rows, DEFAULT_RATES);
    expect(t.concrete).toBeGreaterThan(0);
    expect(t.formwork).toBeGreaterThan(0);
    expect(t.steel).toBeGreaterThan(0);
    expect(t.steelAtRates).toBeGreaterThan(0);
    expect(t.blocks).toBeGreaterThan(0);
  });

  it('counts hollow blocks for a one-way ribbed panel', () => {
    const rib = els.find((e) => e.typeId === 'ribbed-slab')!;
    expect(blockCount(rib)).toBeGreaterThan(50);
  });

  it('sums by type to the same totals and writes a CSV', () => {
    const order = elementTypes.map((e) => e.id);
    expect(totals(byType(rows, order)).concrete).toBeCloseTo(totals(rows).concrete);
    const csv = takeoffCsv('Test', rows, (id) => id, DEFAULT_RATES);
    expect(csv.split('\r\n')).toHaveLength(rows.length + 4);
  });
});

describe('element library', () => {
  it('has a drawable, measurable sample for every type', () => {
    expect(elementTypes.length).toBeGreaterThanOrEqual(16);
    for (const t of elementTypes) {
      expect(sectionFacts(t.sample.section).length, t.id).toBeGreaterThan(0);
      const q = quantities(t.sample);
      expect(q.concrete, t.id).toBeGreaterThan(0);
      expect(q.steel, t.id).toBeGreaterThan(0);
      expect(cageFor(t.sample)?.bars.length ?? 0, t.id).toBeGreaterThan(0);
      expect(t.checks.length, t.id).toBeGreaterThan(0);
      expect(t.name.ar && t.summary.ar && t.use.ar && t.recognise.ar && t.takeoff.ar, t.id).toBeTruthy();
    }
  });

  it('has unique ids and Arabic text for every check', () => {
    expect(new Set(elementTypes.map((t) => t.id)).size).toBe(elementTypes.length);
    for (const t of elementTypes) for (const c of t.checks) expect(c.text.ar, `${t.id} ${c.clause}`).toBeTruthy();
  });
});

describe('tools text', () => {
  const keys = (o: unknown, p = ''): string[] =>
    o && typeof o === 'object' && !Array.isArray(o) ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}${k}.`)) : [p];
  it('has the same keys in Arabic and English', () => {
    expect(keys(toolsAr).sort()).toEqual(keys(toolsEn).sort());
    expect(toolsAr.importer.how).toHaveLength(toolsEn.importer.how.length);
  });
});

describe('auto-added project name', () => {
  it('cleans the model file name', async () => {
    const { nameFromFile } = await import('../src/lib/import/project');
    expect(nameFromFile('villa-master copy (2).$et')).toBe('Villa Master');
    expect(nameFromFile('Office_Tower_Rev3.e2k')).toBe('Office Tower');
  });
});
