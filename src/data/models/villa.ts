import type { BuildingSpec, Section } from '../../lib/structure/types';
import { buildImported, type Detailing, type ImportedModelJson } from '../../lib/structure/imported';
import json from './villa.json';

/**
 * Residential villa — the owner's structural design.
 * Geometry and member sizes: the ETABS master model (VILLA_Master File - Try Modifieres.EDB,
 * ETABS v20.3, 27 Sep 2026), exported to text and imported by scripts/import-etabs.mjs. Reinforcement the analysis model does not carry comes from the
 * structural drawings: S-203 footings, S-205 columns, S-207 ground/strap beams, S-211 covers,
 * S-212 beams, hidden beams and ribs. Where a member's schedule type is not in the model, the
 * typical type is shown and the note says so.
 */
const CONCRETE = "f'c 30 MPa"; // S-201 / S-205 notes: 300 kg/cm²
const STEEL = 'fy 420 MPa';

/** S-205 column schedule: ties by section length */
const COLUMN_TIES: Record<number, { mark: string; spacing: number }> = {
  400: { mark: 'C1', spacing: 167 }, // 6T10/m
  500: { mark: 'C2', spacing: 167 },
  700: { mark: 'C3', spacing: 167 },
  800: { mark: 'C4', spacing: 167 },
  900: { mark: 'C5', spacing: 200 }, // 5T10/m
};

/** S-212 hidden beams, matched by width (depth 320 for all) */
const HIDDEN: { maxWidth: number; mark: string; bars: number; dia: number; legs: number }[] = [
  { maxWidth: 450, mark: 'HB1', bars: 4, dia: 14, legs: 2 },
  { maxWidth: 550, mark: 'HB2', bars: 6, dia: 16, legs: 4 },
  { maxWidth: 700, mark: 'HB3', bars: 6, dia: 16, legs: 4 },
  { maxWidth: 900, mark: 'HB4', bars: 8, dia: 16, legs: 4 },
  { maxWidth: Infinity, mark: 'HB5', bars: 10, dia: 16, legs: 6 },
];

const detailing: Detailing = {
  column: (_name, b, h, bars): Section => ({
    kind: 'rc-column',
    b,
    h,
    cover: 25, // S-211 note 25
    bars,
    ties: { dia: 10, spacing: COLUMN_TIES[h]?.spacing ?? 167 },
    concrete: CONCRETE,
    steel: STEEL,
  }),
  beam: (_name, story, b, h) => {
    if (story === 'G.B') {
      // S-207 GB1
      return {
        section: { kind: 'rc-beam', b, h, cover: 50, top: { n: 2, dia: 16 }, bottom: { n: 2, dia: 16 }, stirrups: { dia: 10, spacing: 200, legs: 2 }, concrete: CONCRETE, steel: STEEL },
        note: 'Ground beam. Bars shown are type GB1 from S-207; GB2 (3T16 top and bottom) is marked on S-206.',
      };
    }
    // S-212 B2, the typical dropped beam
    return {
      section: { kind: 'rc-beam', b, h, cover: 25, top: { n: 2, dia: 14 }, bottom: { n: 3, dia: 14 }, stirrups: { dia: 10, spacing: 150, legs: 2 }, concrete: CONCRETE, steel: STEEL },
      note: 'Bars shown are the typical dropped beam B2 from S-212 (3T14 bottom, 2T14 top + 1T14 at supports). Each beam’s type B1–B5 is marked on the framing plans.',
    };
  },
  slab: (name, prop, widthMm) => {
    if (prop.kind === 'ribbed') {
      return {
        kind: 'slab',
        section: {
          kind: 'ribbed-slab',
          depth: prop.depth ?? 320,
          topping: prop.t,
          ribWidth: prop.ribWidth ?? 150,
          ribSpacing: prop.ribSpacing ?? 550,
          ribAxis: prop.ribAxis === 2 ? 'z' : 'x',
          ribBars: { top: { n: 2, dia: 12 }, bottom: { n: 2, dia: 12 } },
          ribLinks: { dia: 8, spacing: 200 },
          cover: 20,
          concrete: CONCRETE,
          steel: STEEL,
        },
        note: 'Rib bars shown are type R1 from S-212; R2/R3 (2T14, 2T16) apply where marked on the plans.',
      };
    }
    if (name.startsWith('H.B')) {
      const hb = HIDDEN.find((x) => widthMm <= x.maxWidth)!;
      return {
        kind: 'beam',
        section: { kind: 'rc-beam', b: widthMm, h: prop.t, cover: 25, top: { n: hb.bars, dia: hb.dia }, bottom: { n: hb.bars, dia: hb.dia }, stirrups: { dia: 10, spacing: 150, legs: hb.legs }, concrete: CONCRETE, steel: STEEL },
        note: `Hidden beam within the slab depth. Reinforcement of ${hb.mark} from S-212, matched by width.`,
      };
    }
    // S-211 note 26: all slabs 5Ø12/m unless noted
    return { kind: 'slab', section: { kind: 'rc-slab', t: prop.t, cover: 20, bottom: { dia: 12, spacing: 200 }, concrete: CONCRETE, steel: STEEL } };
  },
  footing: (l, b, t) => ({ kind: 'rc-footing', l, b, t, cover: 70, bottom: { dia: 14, spacing: 167 }, concrete: CONCRETE, steel: STEEL }),
  strap: (b, h) => ({ kind: 'rc-beam', b, h, cover: 50, top: { n: 4, dia: 16 }, bottom: { n: 2, dia: 16 }, stirrups: { dia: 10, spacing: 167, legs: 2 }, concrete: CONCRETE, steel: STEEL }),
};

const model = json as unknown as ImportedModelJson;
const built = buildImported(model, detailing);

export const villaModel = model;

export const villa: BuildingSpec = {
  id: 'villa',
  projectSlug: 'residential-villa-structural-design',
  name: 'Residential villa',
  system: 'rc-frame',
  floors: built.levelNames.length,
  storeyHeight: built.bounds.h / built.levelNames.length,
  baysX: [built.bounds.w],
  baysZ: [built.bounds.d],
  site: { x: -40, z: 26 },
  basis: 'project',
  levelNames: built.levelNames,
  imported: built,
};
