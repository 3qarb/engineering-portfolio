import type { BuildingSpec, Section, StructuralElement } from './types';
import { grid, letter } from './grid';
import { WALL_GROUND } from './heritage';

/* ── Façade retention scaffold ─────────────────────────────── */

const TUBE: Section = { kind: 'steel-tube', od: 48.3, t: 4, grade: 'S235 · EN 39' };
const BOARD: Section = { kind: 'layered', layers: [{ name: 'Steel scaffold board', t: 63 }] };
const VIS = 0.09; // drawn thickness so tubes read at site scale

export function scaffold(spec: BuildingSpec): StructuralElement[] {
  const out: StructuralElement[] = [];
  const { xs, zs, w } = grid(spec);
  const H = spec.storeyHeight;
  const top = spec.floors * H;
  const faceZ = zs[0] - 0.55;

  out.push({
    id: 'W-FACADE',
    kind: 'wall',
    label: 'Retained historic façade',
    level: -1,
    grid: `${letter(0)}–${letter(xs.length - 1)}`,
    position: [0, (top + 0.8) / 2, faceZ],
    size: [w + 0.6, top + 0.8, 0.6],
    length: w,
    section: WALL_GROUND,
    note: 'Held by the scaffold while the structure behind it is rebuilt.',
  });

  for (let L = 0; L < spec.floors; L++) {
    const base = L * H;
    xs.forEach((x, i) =>
      zs.forEach((z, j) => {
        out.push({
          id: `ST-${letter(i)}${j + 1}-L${L}`,
          kind: 'tube',
          label: `Standard ${letter(i)}${j + 1}, lift ${L + 1}`,
          level: L,
          grid: `${letter(i)}/${j + 1}`,
          position: [x, base + H / 2, z],
          size: [VIS, H, VIS],
          length: H,
          section: TUBE,
        });
      }),
    );
    zs.forEach((z, j) =>
      xs.slice(0, -1).forEach((x, i) => {
        const span = xs[i + 1] - x;
        out.push({
          id: `LG-${letter(i)}${letter(i + 1)}${j + 1}-L${L}`,
          kind: 'tube',
          label: `Ledger ${letter(i)}–${letter(i + 1)}, lift ${L + 1}`,
          level: L,
          grid: `${letter(i)}–${letter(i + 1)}/${j + 1}`,
          position: [x + span / 2, base + H, z],
          size: [span, VIS, VIS],
          length: span,
          section: TUBE,
        });
        if (j === 0) {
          out.push({
            id: `BD-${letter(i)}${letter(i + 1)}-L${L}`,
            kind: 'slab',
            label: `Working platform ${letter(i)}–${letter(i + 1)}, lift ${L + 1}`,
            level: L,
            grid: `${letter(i)}–${letter(i + 1)}`,
            position: [x + span / 2, base + H + 0.06, (zs[0] + zs[zs.length - 1]) / 2],
            size: [span - 0.06, 0.05, zs[zs.length - 1] - zs[0] - 0.06],
            length: span,
            section: BOARD,
          });
        }
      }),
    );
    xs.forEach((x, i) => {
      const width = zs[zs.length - 1] - zs[0];
      out.push({
        id: `TR-${letter(i)}-L${L}`,
        kind: 'tube',
        label: `Transom ${letter(i)}, lift ${L + 1}`,
        level: L,
        grid: letter(i),
        position: [x, base + H, (zs[0] + zs[zs.length - 1]) / 2 - 0.25],
        size: [VIS, VIS, width + 0.5],
        length: width + 0.5,
        section: TUBE,
      });
    });
    // Façade bracing on the outer line, end bays
    [0, xs.length - 2].forEach((i) => {
      const span = xs[i + 1] - xs[i];
      const len = Math.hypot(span, H);
      const dir = (L + i) % 2 === 0 ? 1 : -1;
      out.push({
        id: `BR-${letter(i)}-L${L}`,
        kind: 'tube',
        label: `Façade brace ${letter(i)}–${letter(i + 1)}, lift ${L + 1}`,
        level: L,
        grid: `${letter(i)}–${letter(i + 1)}`,
        position: [xs[i] + span / 2, base + H / 2, zs[zs.length - 1] + 0.12],
        size: [len, VIS, VIS],
        rotation: [0, 0, dir * Math.atan2(H, span)],
        length: len,
        section: TUBE,
      });
    });
  }
  return out;
}
