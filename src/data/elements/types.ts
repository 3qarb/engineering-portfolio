import type { StructuralElement } from '../../lib/structure/types';

/** English and Arabic text side by side */
export interface T2 {
  en: string;
  ar: string;
}

export type ElementCategory = 'slab' | 'beam' | 'vertical' | 'stair-ramp' | 'foundation';

export interface CodeCheck {
  /** Clause, e.g. "ACI 318-19 §9.8.1.4" or "SBC 201 §1011.5.2" */
  clause: string;
  text: T2;
  /** 'code' = a requirement of the cited document; 'guidance' = common practice, not a code limit */
  basis?: 'code' | 'guidance';
}

export interface ElementType {
  id: string;
  category: ElementCategory;
  name: T2;
  /** What it is, in one or two sentences */
  summary: T2;
  /** When an engineer chooses it */
  use: T2;
  /** How the model reader finds it in an ETABS or SAFE text file */
  recognise: T2;
  checks: CodeCheck[];
  /** How the quantity take-off measures it */
  takeoff: T2;
  /** A typical member, drawn in the 3D detail and the section drawing. Typical values, not a design. */
  sample: StructuralElement;
}

export const CATEGORY_LABEL: Record<ElementCategory, T2> = {
  slab: { en: 'Slabs', ar: 'البلاطات' },
  beam: { en: 'Beams', ar: 'الكمرات' },
  vertical: { en: 'Columns and walls', ar: 'الأعمدة والجدران' },
  'stair-ramp': { en: 'Stairs and ramps', ar: 'السلالم والمنحدرات' },
  foundation: { en: 'Foundations', ar: 'الأساسات' },
};

const C30 = "f'c 30 MPa";
const FY = 'fy 420 MPa';
export const MAT = { concrete: C30, steel: FY };

/** A sample member standing on the origin. */
export function sample(
  id: string,
  kind: StructuralElement['kind'],
  label: string,
  size: [number, number, number],
  section: StructuralElement['section'],
  extra: Partial<StructuralElement> = {},
): StructuralElement {
  return {
    id: `sample-${id}`,
    typeId: id,
    kind,
    label,
    level: 0,
    grid: '—',
    position: [0, size[1] / 2, 0],
    size,
    length: Math.max(...size),
    section,
    ...extra,
  };
}
