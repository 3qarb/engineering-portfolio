import { describe, expect, it } from 'vitest';
import { barArea, quantities, sectionFacts, steelArea } from '../src/lib/structure/sectionMath';
import { buildings } from '../src/data/buildings';
import { elementsFor } from '../src/lib/structure/generate';

const office = buildings.find((b) => b.id === 'rc-office-block')!;
const fact = (facts: { label: string; value: string }[], label: string) => facts.find((f) => f.label === label)?.value;

describe('bar areas', () => {
  it('matches π·d²/4', () => {
    expect(barArea(25)).toBeCloseTo(490.87, 2);
    expect(barArea(10)).toBeCloseTo(78.54, 2);
  });
});

describe('rc column 500×700 16T25', () => {
  const col = office.rc!.columnLower!;
  it('has As = 16 × 490.9 = 7854 mm²', () => {
    expect(steelArea(col)).toBeCloseTo(7854, 0);
  });
  it('reports ρ = As / (b·h) = 2.24 %', () => {
    expect(fact(sectionFacts(col), 'Steel ratio ρ')).toBe('2.24 %');
  });
});

describe('rc beam 300×650', () => {
  const beam = office.rc!.beam;
  it('effective depth d = h − cover − stirrup − bar/2 = 599 mm', () => {
    expect(fact(sectionFacts(beam), 'Effective depth d')).toBe('599 mm');
  });
});

describe('rc slab mesh', () => {
  it('sums bottom T12@200 and top T10@200 per metre', () => {
    const slab = office.rc!.slab;
    expect(steelArea(slab)).toBeCloseTo((barArea(12) * 1000) / 200 + (barArea(10) * 1000) / 200, 6);
  });
});

describe('quantities', () => {
  it('column steel weight = As · L · 7850', () => {
    const el = elementsFor(office).find((e) => e.kind === 'column')!;
    const q = quantities(el);
    const s = el.section;
    if (s.kind !== 'rc-column') throw new Error('expected a column');
    expect(q.steel).toBeCloseTo(steelArea(s) * 1e-6 * el.length * 7850, 6);
    expect(q.concrete).toBeCloseTo(el.size[0] * el.size[1] * el.size[2], 9);
  });
  it('returns nothing for members without concrete', () => {
    const scaffold = buildings.find((b) => b.system === 'scaffold')!;
    const tube = elementsFor(scaffold).find((e) => e.kind === 'tube')!;
    expect(quantities(tube)).toEqual({});
  });
});
