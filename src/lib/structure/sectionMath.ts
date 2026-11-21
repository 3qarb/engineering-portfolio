import type { Section, StructuralElement } from './types';

const STEEL_DENSITY = 7850; // kg/m³

export const barArea = (dia: number) => (Math.PI * dia * dia) / 4;

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const mm = (m: number) => `${fmt(m * 1000)} mm`;

export interface SectionFact {
  label: string;
  value: string;
}

/** Steel area per element cross-section (mm²) for bar-based sections, or per metre for meshes. */
export function steelArea(section: Section): number {
  switch (section.kind) {
    case 'rc-column':
      return section.bars.n * barArea(section.bars.dia);
    case 'rc-beam':
      return (
        section.top.n * barArea(section.top.dia) + section.bottom.n * barArea(section.bottom.dia)
      );
    case 'rc-slab': {
      const b = (barArea(section.bottom.dia) * 1000) / section.bottom.spacing;
      const t = section.top ? (barArea(section.top.dia) * 1000) / section.top.spacing : 0;
      return b + t;
    }
    case 'rc-footing':
      return (barArea(section.bottom.dia) * 1000) / section.bottom.spacing;
    case 'ribbed-slab': {
      // rib bars per metre of slab width, across the ribs
      const perRib = section.ribBars.top.n * barArea(section.ribBars.top.dia) + section.ribBars.bottom.n * barArea(section.ribBars.bottom.dia);
      return (perRib * 1000) / section.ribSpacing;
    }
    default:
      return 0;
  }
}

export function sectionFacts(section: Section): SectionFact[] {
  switch (section.kind) {
    case 'rc-column': {
      const as = steelArea(section);
      const rho = (as / (section.b * section.h)) * 100;
      const facts: SectionFact[] = [
        { label: 'Section', value: `${section.b} × ${section.h} mm` },
        { label: 'Main bars', value: `${section.bars.n} T${section.bars.dia}` },
        { label: 'Ties', value: `T${section.ties.dia} @ ${section.ties.spacing} mm` },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Steel area As', value: `${fmt(as)} mm²` },
        { label: 'Steel ratio ρ', value: `${fmt(rho, 2)} %` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
      if (section.jacketFrom) {
        facts.splice(1, 0, {
          label: 'Original core',
          value: `${section.jacketFrom.b} × ${section.jacketFrom.h} mm`,
        });
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
        {
          label: 'Stirrups',
          value: `T${section.stirrups.dia} @ ${section.stirrups.spacing} (${section.stirrups.legs} legs)`,
        },
        { label: 'Effective depth d', value: `${fmt(d)} mm` },
        { label: 'Tension steel ρ', value: `${fmt((asb / (section.b * d)) * 100, 2)} %` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    }
    case 'rc-slab':
      return [
        { label: 'Thickness', value: `${section.t} mm` },
        { label: 'Bottom mesh', value: `T${section.bottom.dia} @ ${section.bottom.spacing} mm` },
        {
          label: 'Top mesh',
          value: section.top ? `T${section.top.dia} @ ${section.top.spacing} mm` : 'None',
        },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Steel per metre', value: `${fmt(steelArea(section))} mm²/m` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'rc-footing':
      return [
        { label: 'Plan size', value: `${section.l} × ${section.b} mm` },
        { label: 'Depth', value: `${section.t} mm` },
        { label: 'Bottom mesh', value: `T${section.bottom.dia} @ ${section.bottom.spacing} each way` },
        { label: 'Clear cover', value: `${section.cover} mm` },
        { label: 'Concrete', value: section.concrete },
        { label: 'Steel grade', value: section.steel },
      ];
    case 'ribbed-slab':
      return [
        { label: 'Overall depth', value: `${section.depth} mm` },
        { label: 'Topping', value: `${section.topping} mm` },
        { label: 'Ribs', value: `${section.ribWidth} wide @ ${section.ribSpacing} c/c` },
        { label: 'Ribs run along', value: section.ribAxis === 'x' ? 'X (east–west)' : 'Y (north–south)' },
        { label: 'Rib bars', value: `${section.ribBars.bottom.n} T${section.ribBars.bottom.dia} B · ${section.ribBars.top.n} T${section.ribBars.top.dia} T` },
        { label: 'Rib links', value: `T${section.ribLinks.dia} @ ${section.ribLinks.spacing} mm` },
        { label: 'Equivalent concrete', value: `${fmt(ribbedEquivalent(section))} mm` },
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
        {
          label: 'Area',
          value: `${fmt((Math.PI / 4) * (section.od ** 2 - (section.od - 2 * section.t) ** 2))} mm²`,
        },
      ];
  }
}

/** Concrete per square metre of a hollow-block slab, as a solid thickness (mm): topping + ribs. */
export function ribbedEquivalent(s: Extract<Section, { kind: 'ribbed-slab' }>): number {
  return s.topping + ((s.depth - s.topping) * s.ribWidth) / s.ribSpacing;
}

/** Approximate concrete volume (m³) and reinforcement weight (kg) for one element. */
export function quantities(el: StructuralElement): { concrete?: number; steel?: number } {
  const s = el.section;
  const [x, y, z] = el.size;
  if (s.kind === 'rc-column' || s.kind === 'rc-beam') {
    return {
      concrete: x * y * z,
      steel: steelArea(s) * 1e-6 * el.length * STEEL_DENSITY,
    };
  }
  if (s.kind === 'ribbed-slab') {
    const area = x * z;
    return { concrete: area * ribbedEquivalent(s) * 1e-3, steel: steelArea(s) * 1e-6 * STEEL_DENSITY * area };
  }
  if (s.kind === 'rc-slab' || s.kind === 'rc-footing') {
    const area = x * z;
    // mm²/m of mesh → kg/m² for one direction; meshes run both ways
    const perSqM = steelArea(s) * 1e-6 * STEEL_DENSITY;
    return { concrete: area * y, steel: perSqM * area * 2 };
  }
  return {};
}
