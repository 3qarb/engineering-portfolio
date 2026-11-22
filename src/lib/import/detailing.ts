// Reinforcement for members whose model carries no bar data: ACI 318-19 minimum steel and maximum
// spacings. A lower bound for budgeting and for drawing a credible cage — not the project's design.
import type { Detailing } from '../structure/imported';
import type { Mesh, Section } from '../structure/types';

const AREA = (d: number) => (Math.PI * d * d) / 4;

/** Mesh of bar `dia` giving at least `asPerM` mm²/m, at no more than `maxS` mm, in 25 mm steps. */
function meshFor(asPerM: number, maxS: number, sizes = [10, 12, 14, 16, 20]): Mesh {
  for (const dia of sizes) {
    const s = Math.min(maxS, Math.floor((AREA(dia) * 1000) / Math.max(asPerM, 1) / 25) * 25);
    if (s >= 100) return { dia, spacing: s };
  }
  const dia = sizes[sizes.length - 1];
  return { dia, spacing: 100 };
}

/** Bars of `dia` to give at least `as` mm², at least `min` bars. */
const barsFor = (as: number, dia: number, min = 2) => ({ n: Math.max(min, Math.ceil(as / AREA(dia))), dia });

export function minimumDetailing(materials?: { fc?: number; fy?: number }): Required<Detailing> {
  const fc = materials?.fc ?? 28;
  const fy = materials?.fy ?? 420;
  const concrete = `f'c ${fc} MPa`;
  const steel = `fy ${fy} MPa`;
  // §9.6.1.2
  const asMinBeam = (b: number, d: number) => Math.max((0.25 * Math.sqrt(fc)) / fy, 1.4 / fy) * b * d;
  // §7.6.1.1 / §24.4.3.2, Grade 420
  const rhoSlab = fy >= 420 ? 0.0018 : 0.002;

  const beam = (b: number, h: number, cover: number): Section => {
    const d = h - cover - 10 - 8;
    const bottom = barsFor(asMinBeam(b, d), 16);
    // §9.7.6.2.2: d/2 and 600 mm
    const spacing = Math.min(Math.floor(d / 2 / 25) * 25, 600);
    return { kind: 'rc-beam', b, h, cover, top: { n: 2, dia: 16 }, bottom, stirrups: { dia: 10, spacing, legs: b > 600 ? 4 : 2 }, concrete, steel };
  };

  return {
    column: (_name, b, h, bars, shape = 'rect') => {
      const ag = shape === 'circle' ? (Math.PI * b * b) / 4 : b * h;
      // §10.6.1.1: at least 1 %; §10.7.3.1: 4 bars in ties, 6 in spirals
      const main = bars ?? barsFor(0.01 * ag, 16, shape === 'circle' ? 6 : 4);
      const even = shape === 'circle' ? main : { ...main, n: main.n + (main.n % 2) };
      // §25.7.2.1: 16 db, 48 dt, least dimension
      const tie = shape === 'circle' ? 75 : Math.floor(Math.min(16 * even.dia, 48 * 10, Math.min(b, h)) / 25) * 25;
      return { kind: 'rc-column', shape, b, h, cover: 40, bars: even, ties: { dia: 10, spacing: tie }, concrete, steel };
    },
    beam: (_name, _story, b, h) => ({
      section: beam(b, h, 40),
      note: 'Reinforcement shown is the ACI 318-19 minimum (§9.6.1.2, §9.7.6.2.2): the model file carries no beam bars.',
    }),
    slab: (_name, prop, widthMm) => {
      if (prop.kind === 'ribbed' || prop.kind === 'waffle') {
        const depth = prop.depth ?? prop.t + 250;
        const bw = prop.ribWidth ?? 150;
        const d = depth - 20 - 8 - 6;
        return {
          kind: 'slab',
          section: {
            kind: 'ribbed-slab',
            depth,
            topping: prop.t,
            ribWidth: bw,
            ribSpacing: prop.ribSpacing ?? (prop.kind === 'waffle' ? 900 : 550),
            ribAxis: prop.kind === 'waffle' ? 'both' : prop.ribAxis === 2 ? 'z' : 'x',
            ribBars: { top: { n: 1, dia: 12 }, bottom: barsFor(asMinBeam(bw, d), 12) },
            ribLinks: { dia: 8, spacing: Math.min(Math.floor(d / 2 / 25) * 25, 600) },
            filler: prop.kind === 'waffle' ? 'void' : 'block',
            toppingMesh: meshFor(rhoSlab * prop.t * 1000, Math.min(3 * prop.t, 450), [8, 10, 12]),
            cover: 20,
            concrete,
            steel,
          },
          note: 'Rib bars are the ACI 318-19 minimum for the rib (§9.6.1.2); the model file carries no slab reinforcement.',
        };
      }
      const t = prop.t;
      const mesh = meshFor(rhoSlab * t * 1000, Math.min(3 * t, 450));
      if (prop.kind === 'mat') {
        const m = meshFor(rhoSlab * t * 1000 * 0.5, 300, [16, 20, 25]);
        return { kind: 'slab', section: { kind: 'rc-footing', l: widthMm, b: widthMm, t, cover: 75, bottom: m, top: m, concrete, steel } };
      }
      return {
        kind: 'slab',
        section: { kind: 'rc-slab', t, cover: 20, bottom: mesh, top: prop.kind === 'drop' ? mesh : undefined, concrete, steel },
        note: 'Mesh shown is the ACI 318-19 minimum, 0.0018 Ag (§7.6.1.1); the model file carries no slab reinforcement.',
      };
    },
    footing: (l, b, t) => ({ kind: 'rc-footing', l, b, t, cover: 75, bottom: meshFor(rhoSlab * t * 1000, Math.min(3 * t, 450), [12, 14, 16, 20]), concrete, steel }),
    strap: (b, h) => beam(b, h, 50),
    wall: (t) => {
      // Table 11.6.1 (bars ≤ T16, fy ≥ 420): ρℓ 0.0012, ρt 0.0020; §11.7.2.3: two layers above 250 mm
      const layers = t > 250 ? 2 : 1;
      const maxS = Math.min(3 * t, 450);
      return {
        kind: 'rc-wall',
        t,
        cover: 25,
        layers,
        vertical: meshFor((0.0012 * t * 1000) / layers, maxS, [10, 12, 14, 16]),
        horizontal: meshFor((0.002 * t * 1000) / layers, maxS, [10, 12, 14, 16]),
        concrete,
        steel,
      };
    },
    stair: (waist, riser, tread, steps, width) => ({
      kind: 'stair',
      waist,
      riser,
      tread,
      steps,
      width,
      cover: 25,
      main: meshFor(rhoSlab * waist * 1000, Math.min(3 * waist, 450), [10, 12, 14, 16]),
      distribution: meshFor(rhoSlab * waist * 1000 * 0.5, 300, [8, 10]),
      concrete,
      steel,
    }),
    ramp: (t, slope) => {
      const mesh = meshFor(rhoSlab * t * 1000, Math.min(3 * t, 450));
      return { kind: 'ramp', t, slope, cover: 30, bottom: mesh, top: mesh, concrete, steel };
    },
  };
}
