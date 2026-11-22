import type { Mesh, Section, StructuralElement } from './types';

const STEEL_DENSITY = 7850; // kg/m³

export const barArea = (dia: number) => (Math.PI * dia * dia) / 4;

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const mm = (m: number) => `${fmt(m * 1000)} mm`;

export interface SectionFact {
  label: string;
  value: string;
}

/** Steel area of a mesh, mm² per metre width */
export const meshArea = (m: Mesh) => (barArea(m.dia) * 1000) / m.spacing;
/** Weight of a mesh, kg per m² of surface, one direction */
const meshKg = (m: Mesh) => meshArea(m) * 1e-6 * STEEL_DENSITY;
/** Weight of bars: area mm² × length m */
const barKg = (areaMm2: number, lengthM: number) => areaMm2 * 1e-6 * lengthM * STEEL_DENSITY;
const meshText = (m: Mesh) => `T${m.dia} @ ${m.spacing} mm`;

/** Steel area per element cross-section (mm²) for bar-based sections, or per metre for meshes. */
export function steelArea(section: Section): number {
  switch (section.kind) {
    case 'rc-column':
      return section.bars.n * barArea(section.bars.dia);
    case 'rc-beam':
      return section.top.n * barArea(section.top.dia) + section.bottom.n * barArea(section.bottom.dia);
    case 'rc-slab':
      return meshArea(section.bottom) + (section.top ? meshArea(section.top) : 0);
    case 'rc-footing':
      return meshArea(section.bottom) + (section.top ? meshArea(section.top) : 0);
    case 'ribbed-slab': {
      // rib bars per metre of slab width, across the ribs
      const perRib = section.ribBars.top.n * barArea(section.ribBars.top.dia) + section.ribBars.bottom.n * barArea(section.ribBars.bottom.dia);
      return (perRib * 1000) / section.ribSpacing;
    }
    case 'rc-wall':
      return (meshArea(section.vertical) + meshArea(section.horizontal)) * section.layers;
    case 'stair':
      return meshArea(section.main);
    case 'ramp':
      return meshArea(section.bottom) + (section.top ? meshArea(section.top) : 0);
    default:
      return 0;
  }
}

/** Concrete per square metre of a ribbed slab, as a solid thickness (mm): topping + ribs. */
export function ribbedEquivalent(s: Extract<Section, { kind: 'ribbed-slab' }>): number {
  const stem = s.depth - s.topping;
  const f = s.ribWidth / s.ribSpacing;
  // two-way ribs: the stems cover the plan except the void squares between them
  const cover = s.ribAxis === 'both' ? 1 - (1 - f) ** 2 : f;
  return s.topping + stem * cover;
}

/** Clear distance between ribs, mm */
export const ribClear = (s: Extract<Section, { kind: 'ribbed-slab' }>) => s.ribSpacing - s.ribWidth;

export function sectionFacts(section: Section): SectionFact[] {
  switch (section.kind) {
    case 'rc-column': {
      const as = steelArea(section);
      const circle = section.shape === 'circle';
      const ag = circle ? (Math.PI * section.b ** 2) / 4 : section.b * section.h;
      const facts: SectionFact[] = [
        { label: 'Section', value: circle ? `Ø${section.b} mm` : `${section.b} × ${section.h} mm` },
        { label: 'Main bars', value: `${section.bars.n} T${section.bars.dia}` },
        { label: circle ? 'Spiral' : 'Ties', value: `T${section.ties.dia} @ ${section.ties.spacing} mm${circle ? ' pitch' : ''}` },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Steel area As', value: `${fmt(as)} mm²` },
        { label: 'Steel ratio ρ', value: `${fmt((as / ag) * 100, 2)} %` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
      if (section.jacketFrom) {
        facts.splice(1, 0, { label: 'Original core', value: `${section.jacketFrom.b} × ${section.jacketFrom.h} mm` });
      }
      return facts;
    }
    case 'rc-beam': {
      const d = section.h - section.cover - section.stirrups.dia - section.bottom.dia / 2;
      const asb = section.bottom.n * barArea(section.bottom.dia);
      return [
        { label: 'Section', value: `${section.b} × ${section.h} mm` },
        { label: 'Top bars', value: `${section.top.n} T${section.top.dia}` },
        { label: 'Bottom bars', value: `${section.bottom.n} T${section.bottom.dia}` },
        { label: 'Stirrups', value: `T${section.stirrups.dia} @ ${section.stirrups.spacing} (${section.stirrups.legs} legs)` },
        { label: 'Effective depth d', value: `${fmt(d)} mm` },
        { label: 'Tension steel ρ', value: `${fmt((asb / (section.b * d)) * 100, 2)} %` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    }
    case 'rc-slab': {
      const facts: SectionFact[] = [
        { label: 'Thickness', value: `${section.t} mm` },
        { label: 'Bottom mesh', value: meshText(section.bottom) },
        { label: 'Top mesh', value: section.top ? meshText(section.top) : 'None' },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Steel per metre', value: `${fmt(steelArea(section))} mm²/m` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
      if (section.drop) {
        facts.splice(1, 0, { label: 'Drop panel', value: `${section.drop.size} × ${section.drop.size}, +${section.drop.t} mm` });
      }
      return facts;
    }
    case 'rc-footing':
      return [
        { label: 'Plan size', value: `${section.l} × ${section.b} mm` },
        { label: 'Depth', value: `${section.t} mm` },
        { label: 'Bottom mesh', value: `${meshText(section.bottom)} each way` },
        { label: 'Top mesh', value: section.top ? `${meshText(section.top)} each way` : 'None' },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'ribbed-slab':
      return [
        { label: 'Overall depth', value: `${section.depth} mm` },
        { label: 'Topping', value: `${section.topping} mm` },
        { label: 'Ribs', value: `${section.ribWidth} wide @ ${section.ribSpacing} c/c` },
        {
          label: 'Ribs run along',
          value: section.ribAxis === 'both' ? 'Both ways (waffle)' : section.ribAxis === 'x' ? 'X (east–west)' : 'Y (north–south)',
        },
        { label: 'Between ribs', value: section.filler === 'void' ? 'Removable void formers' : 'Hollow blocks (left in place)' },
        { label: 'Rib bars', value: `${section.ribBars.bottom.n} T${section.ribBars.bottom.dia} B · ${section.ribBars.top.n} T${section.ribBars.top.dia} T` },
        { label: 'Rib links', value: `T${section.ribLinks.dia} @ ${section.ribLinks.spacing} mm` },
        { label: 'Topping mesh', value: section.toppingMesh ? meshText(section.toppingMesh) : 'None' },
        { label: 'Equivalent concrete', value: `${fmt(ribbedEquivalent(section))} mm` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'rc-wall':
      return [
        { label: 'Thickness', value: `${section.t} mm` },
        { label: 'Vertical bars', value: `${meshText(section.vertical)}${section.layers === 2 ? ', each face' : ''}` },
        { label: 'Horizontal bars', value: `${meshText(section.horizontal)}${section.layers === 2 ? ', each face' : ''}` },
        { label: 'Layers', value: String(section.layers) },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'ρ vertical', value: `${fmt((meshArea(section.vertical) * section.layers * 100) / (section.t * 1000), 2)} %` },
        { label: 'ρ horizontal', value: `${fmt((meshArea(section.horizontal) * section.layers * 100) / (section.t * 1000), 2)} %` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'stair':
      return [
        { label: 'Waist', value: `${section.waist} mm` },
        { label: 'Riser × tread', value: `${section.riser} × ${section.tread} mm` },
        { label: 'Steps', value: String(section.steps) },
        { label: '2R + T', value: `${fmt(2 * section.riser + section.tread)} mm` },
        { label: 'Width', value: `${section.width} mm` },
        { label: 'Main bars', value: `${meshText(section.main)} B` },
        { label: 'Distribution', value: meshText(section.distribution) },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'ramp':
      return [
        { label: 'Thickness', value: `${section.t} mm` },
        { label: 'Slope', value: `${fmt(section.slope, 1)} % (1:${fmt(100 / Math.max(section.slope, 0.1), 1)})` },
        { label: 'Bottom mesh', value: meshText(section.bottom) },
        { label: 'Top mesh', value: section.top ? meshText(section.top) : 'None' },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'masonry-wall':
      return [
        { label: 'Thickness', value: `${section.t} mm` },
        { label: 'Material', value: section.material },
        { label: 'Mortar', value: section.mortar },
      ];
    case 'timber-beam':
      return [
        { label: 'Section', value: `${section.b} × ${section.h} mm` },
        { label: 'Species', value: section.species },
        { label: 'Grade', value: section.grade },
      ];
    case 'layered':
      return [
        ...section.layers.map((l) => ({ label: l.name, value: `${l.t} mm` })),
        { label: 'Total', value: `${section.layers.reduce((a, l) => a + l.t, 0)} mm` },
      ];
    case 'steel-tube':
      return [
        { label: 'Outside diameter', value: `${section.od} mm` },
        { label: 'Wall thickness', value: `${section.t} mm` },
        { label: 'Steel grade', value: section.grade },
        { label: 'Area', value: `${fmt((Math.PI / 4) * (section.od ** 2 - (section.od - 2 * section.t) ** 2))} mm²` },
      ];
  }
}

export interface Quantities {
  /** m³ */
  concrete?: number;
  /** kg, main bars plus ties, stirrups and links; no laps, hooks or chairs */
  steel?: number;
  /** m² of formed surface */
  formwork?: number;
}

/** Concrete volume, formwork area and reinforcement weight for one element. */
export function quantities(el: StructuralElement): Quantities {
  const s = el.section;
  const [x, y, z] = el.size;
  const MM = 0.001;
  switch (s.kind) {
    case 'rc-column': {
      const L = el.length;
      const c = s.cover * MM;
      if (s.shape === 'circle') {
        const d = s.b * MM;
        const turns = L / (s.ties.spacing * MM);
        const spiral = barKg(barArea(s.ties.dia), turns * Math.PI * (d - 2 * c));
        return { concrete: (Math.PI * d * d * L) / 4, formwork: Math.PI * d * L, steel: barKg(steelArea(s), L) + spiral };
      }
      const b = s.b * MM;
      const h = s.h * MM;
      const ties = (Math.floor(L / (s.ties.spacing * MM)) + 1) * 2 * (b + h - 4 * c);
      return { concrete: b * h * L, formwork: 2 * (b + h) * L, steel: barKg(steelArea(s), L) + barKg(barArea(s.ties.dia), ties) };
    }
    case 'rc-beam': {
      const L = el.length;
      const b = s.b * MM;
      const h = s.h * MM;
      const c = s.cover * MM;
      const loops = Math.max(1, s.stirrups.legs / 2);
      const stirrups = (Math.floor(L / (s.stirrups.spacing * MM)) + 1) * loops * 2 * (b + h - 4 * c);
      // a hidden beam is formed with the slab soffit; a ground beam sits on blinding
      const formwork = el.typeId === 'hidden-beam' ? b * L : el.typeId === 'ground-beam' || el.typeId === 'strap-beam' ? 2 * h * L : (b + 2 * h) * L;
      return { concrete: b * h * L, formwork, steel: barKg(steelArea(s), L) + barKg(barArea(s.stirrups.dia), stirrups) };
    }
    case 'rc-slab': {
      const area = x * z;
      const drop = s.drop ? (s.drop.size * MM) ** 2 * s.drop.t * MM : 0;
      const steel = (meshKg(s.bottom) + (s.top ? meshKg(s.top) : 0)) * area * 2;
      return { concrete: area * y + drop, formwork: area, steel };
    }
    case 'rc-footing': {
      const area = x * z;
      const steel = (meshKg(s.bottom) + (s.top ? meshKg(s.top) : 0)) * area * 2;
      return { concrete: area * y, formwork: 2 * (x + z) * y, steel };
    }
    case 'ribbed-slab': {
      const area = x * z;
      const sp = s.ribSpacing * MM;
      const rib = s.ribBars.top.n * barArea(s.ribBars.top.dia) + s.ribBars.bottom.n * barArea(s.ribBars.bottom.dia);
      const linkLoop = 2 * ((s.ribWidth + s.depth) * MM - 4 * s.cover * MM);
      const ribsAlong = (len: number, across: number) => {
        const n = Math.max(1, Math.round(across / sp));
        const links = (Math.floor(len / (s.ribLinks.spacing * MM)) + 1) * n;
        return barKg(rib, n * len) + barKg(barArea(s.ribLinks.dia), links * linkLoop);
      };
      let steel = 0;
      if (s.ribAxis === 'both') steel = ribsAlong(x, z) + ribsAlong(z, x);
      else steel = s.ribAxis === 'x' ? ribsAlong(x, z) : ribsAlong(z, x);
      if (s.toppingMesh) steel += meshKg(s.toppingMesh) * area * 2;
      return { concrete: area * ribbedEquivalent(s) * MM, formwork: area, steel };
    }
    case 'rc-wall': {
      const L = Math.max(x, z);
      const H = y;
      const face = L * H;
      return { concrete: face * s.t * MM, formwork: 2 * face, steel: (meshKg(s.vertical) + meshKg(s.horizontal)) * face * s.layers };
    }
    case 'stair': {
      const run = x;
      const rise = y;
      const w = z;
      const sloped = Math.hypot(run, rise);
      const concrete = sloped * s.waist * MM * w + s.steps * ((s.riser * s.tread) / 2) * MM * MM * w;
      const formwork = sloped * w + s.steps * s.riser * MM * w;
      const steel = meshKg(s.main) * sloped * w + meshKg(s.distribution) * sloped * w;
      return { concrete, formwork, steel };
    }
    case 'ramp': {
      const area = x * z;
      return { concrete: area * y, formwork: area, steel: (meshKg(s.bottom) + (s.top ? meshKg(s.top) : 0)) * area * 2 };
    }
    default:
      return {};
  }
}
