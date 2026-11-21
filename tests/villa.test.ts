import { describe, expect, it } from 'vitest';
import { villa, villaModel } from '../src/data/models/villa';
import { parseColumnName } from '../src/lib/structure/imported';
import { buildSchedule } from '../src/lib/structure/schedule';
import { planSequence } from '../src/lib/structure/sequence';

const els = villa.imported!.elements;
const count = (pred: (e: (typeof els)[number]) => boolean) => els.filter(pred).length;

describe('imported villa model', () => {
  it('keeps every member of the ETABS model (report issue)', () => {
    expect(villaModel.columns).toHaveLength(155);
    expect(villaModel.beams).toHaveLength(218);
    expect(villaModel.slabs).toHaveLength(67);
    expect(count((e) => e.kind === 'column')).toBe(155);
    expect(count((e) => e.kind === 'footing')).toBeGreaterThanOrEqual(35);
  });

  it('uses the issued 200 mm wide sections from the model report', () => {
    for (const [, , , , name] of villaModel.columns) expect(parseColumnName(name)?.b, name).toBe(200);
    for (const [, , , , , , name] of villaModel.beams) expect(name).toMatch(/^B 20X/);
  });

  it('places levels at the model elevations', () => {
    expect(villaModel.levels.map((l) => [l.name, l.z])).toEqual([
      ['Base', -1.5],
      ['G.B', 0.65],
      ['G.F', 4.7],
      ['F.F', 8.6],
      ['R.F', 12],
    ]);
    const col = els.find((e) => e.id === 'G.F-C1')!;
    expect(col.position[1] - col.size[1] / 2).toBeCloseTo(0.65, 6);
    expect(col.position[1] + col.size[1] / 2).toBeCloseTo(4.7, 6);
  });

  it('orients H columns along X and V columns along Y', () => {
    for (const e of els.filter((x) => x.kind === 'column')) {
      const s = e.section;
      if (s.kind !== 'rc-column') throw new Error('column section');
      const long = Math.max(e.size[0], e.size[2]);
      expect(long).toBeCloseTo(s.h / 1000, 6);
    }
  });

  it('keeps members inside the plan bounds and ids unique', () => {
    const { w, d } = villa.imported!.bounds;
    for (const e of els.filter((x) => x.level >= 0)) {
      expect(Math.abs(e.position[0])).toBeLessThanOrEqual(w / 2 + 0.01);
      expect(Math.abs(e.position[2])).toBeLessThanOrEqual(d / 2 + 0.01);
    }
    expect(new Set(els.map((e) => e.id)).size).toBe(els.length);
  });

  it('schedules and sequences every member', () => {
    const { total } = buildSchedule(els);
    expect(total.count).toBe(els.length);
    const plan = planSequence(villa, els);
    expect(plan.tasks[0].name).toBe('Foundations');
    expect(plan.tasks.some((t) => t.name.startsWith('G.F'))).toBe(true);
  });
});
