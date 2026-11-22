import { describe, expect, it } from 'vitest';
import { buildings } from '../src/data/buildings';
import { elementsFor } from '../src/lib/structure/generate';
import { buildSchedule, scheduleCsv } from '../src/lib/structure/schedule';
import { activeTask, planSequence } from '../src/lib/structure/sequence';
import { cageFor, perimeterBars } from '../src/lib/structure/rebar';
import { office, scaffold } from './fixtures';

describe.each([...buildings, office, scaffold].map((b) => [b.id, b] as const))('%s', (_id, spec) => {
  const elements = elementsFor(spec);

  it('generates members with unique ids', () => {
    expect(elements.length).toBeGreaterThan(0);
    expect(new Set(elements.map((e) => e.id)).size).toBe(elements.length);
  });

  it('schedule totals add up to the rows and count every member', () => {
    const { rows, total } = buildSchedule(elements);
    expect(total.count).toBe(elements.length);
    expect(rows.reduce((a, r) => a + r.count, 0)).toBe(total.count);
    expect(rows.reduce((a, r) => a + r.steel, 0)).toBeCloseTo(total.steel, 6);
    const csv = scheduleCsv(spec.name, rows, total).split('\r\n');
    expect(csv).toHaveLength(rows.length + 3);
  });

  it('sequence gives every member a build window inside the programme', () => {
    const plan = planSequence(spec, elements);
    for (const e of elements) {
      const w = plan.windowOf.get(e.id);
      expect(w, e.id).toBeDefined();
      expect(w!.start).toBeGreaterThanOrEqual(0);
      expect(w!.finish).toBeLessThanOrEqual(plan.total);
      expect(w!.finish).toBeGreaterThan(w!.start);
    }
    expect(activeTask(plan, 0)).toBeDefined();
  });
});

describe('rc sequence order', () => {
  it('columns of a storey finish before its beams start', () => {
    const spec = office;
    const elements = elementsFor(spec);
    const plan = planSequence(spec, elements);
    const lvl = 2;
    const cols = elements.filter((e) => e.kind === 'column' && e.level === lvl).map((e) => plan.windowOf.get(e.id)!);
    const beams = elements.filter((e) => e.kind === 'beam' && e.level === lvl).map((e) => plan.windowOf.get(e.id)!);
    expect(cols.length).toBeGreaterThan(0);
    expect(beams.length).toBeGreaterThan(0);
    expect(Math.max(...cols.map((w) => w.finish))).toBeLessThanOrEqual(Math.min(...beams.map((w) => w.start)));
  });
});

describe('rebar cages', () => {
  it('places n distinct bars round a section perimeter', () => {
    const pts = perimeterBars(16, 0, 0, 400, 600);
    expect(pts).toHaveLength(16);
    expect(new Set(pts.map((p) => p.join(','))).size).toBe(16);
  });
  it('builds a 16-bar cage with ties for the 500×700 column', () => {
    const spec = office;
    const col = elementsFor(spec).find((e) => e.kind === 'column' && e.level === 0)!;
    const cage = cageFor(col)!;
    // cage dimensions are in metres
    expect(cage.bars.filter((b) => Math.abs(b.dia - 0.025) < 1e-9)).toHaveLength(16);
    expect(cage.loops.length).toBeGreaterThan(0);
  });
});
