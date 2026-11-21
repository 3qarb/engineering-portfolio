/** All section dimensions are in millimetres; positions and sizes in metres. */

export type ElementKind = 'column' | 'beam' | 'slab' | 'footing' | 'wall' | 'tube';

export interface Bar {
  n: number;
  dia: number;
}

export interface Mesh {
  dia: number;
  spacing: number;
}

export type Section =
  | {
      kind: 'rc-column';
      b: number;
      h: number;
      cover: number;
      bars: Bar;
      ties: { dia: number; spacing: number };
      concrete: string;
      steel: string;
      /** Original core when the column was jacketed */
      jacketFrom?: { b: number; h: number };
    }
  | {
      kind: 'rc-beam';
      b: number;
      h: number;
      cover: number;
      top: Bar;
      bottom: Bar;
      stirrups: { dia: number; spacing: number; legs: number };
      concrete: string;
      steel: string;
    }
  | {
      kind: 'rc-slab';
      t: number;
      cover: number;
      bottom: Mesh;
      top?: Mesh;
      concrete: string;
      steel: string;
    }
  | {
      kind: 'rc-footing';
      b: number;
      l: number;
      t: number;
      cover: number;
      bottom: Mesh;
      concrete: string;
      steel: string;
    }
  | {
      /** Hollow-block (ribbed) slab: ribs between hollow blocks under a topping */
      kind: 'ribbed-slab';
      /** Overall depth and topping thickness */
      depth: number;
      topping: number;
      ribWidth: number;
      /** Rib centres */
      ribSpacing: number;
      /** Direction the ribs run in plan */
      ribAxis: 'x' | 'z';
      ribBars: { top: Bar; bottom: Bar };
      ribLinks: { dia: number; spacing: number };
      cover: number;
      concrete: string;
      steel: string;
    }
  | { kind: 'masonry-wall'; t: number; material: string; mortar: string }
  | { kind: 'timber-beam'; b: number; h: number; species: string; grade: string }
  | { kind: 'layered'; layers: { name: string; t: number }[] }
  | { kind: 'steel-tube'; od: number; t: number; grade: string };

export type SectionKind = Section['kind'];

export interface StructuralElement {
  id: string;
  kind: ElementKind;
  label: string;
  level: number;
  grid: string;
  /** Centre point, metres */
  position: [number, number, number];
  /** Box size along x, y, z, metres */
  size: [number, number, number];
  /** Story name from an imported model (e.g. "G.F"); shown instead of the generic level name */
  story?: string;
  /** Optional Euler rotation (radians) */
  rotation?: [number, number, number];
  /** Member length in metres, for quantities */
  length: number;
  section: Section;
  note?: string;
}

export type StructuralSystem = 'rc-frame' | 'heritage-masonry' | 'scaffold';

export interface RcFrameSections {
  column: Extract<Section, { kind: 'rc-column' }>;
  /** Used for the lower half of the storeys when given */
  columnLower?: Extract<Section, { kind: 'rc-column' }>;
  beam: Extract<Section, { kind: 'rc-beam' }>;
  slab: Extract<Section, { kind: 'rc-slab' }>;
  footing: Extract<Section, { kind: 'rc-footing' }>;
}

export interface BuildingSpec {
  id: string;
  /** Project this structure belongs to */
  projectSlug: string;
  name: string;
  system: StructuralSystem;
  floors: number;
  storeyHeight: number;
  baysX: number[];
  baysZ: number[];
  /** Placement on the explorer site */
  site: { x: number; z: number };
  rc?: RcFrameSections;
  /** Names of levels 0, 1, 2… when they have real names (imported models) */
  levelNames?: string[];
  /** A real analysis model converted by scripts/import-etabs.mjs; replaces the generated members */
  imported?: ImportedBuilding;
  /**
   * Where the member sizes come from. 'illustrative' (the default) = typical values chosen to show
   * the system; 'project' = taken from issued project drawings, supplied by the owner.
   */
  basis?: 'illustrative' | 'project';
}

/** Members of an imported model, already converted, plus the facts the panels show. */
export interface ImportedBuilding {
  elements: StructuralElement[];
  /** Plan extents and height above the lowest level, metres */
  bounds: { w: number; d: number; h: number };
  /** Level name → elevation, metres */
  levels: { name: string; z: number }[];
  source: string;
}

export const KIND_LABEL: Record<ElementKind, string> = {
  column: 'Column',
  beam: 'Beam',
  slab: 'Slab',
  footing: 'Footing',
  wall: 'Wall',
  tube: 'Scaffold tube',
};

export const SYSTEM_LABEL: Record<StructuralSystem, string> = {
  'rc-frame': 'Reinforced concrete frame',
  'heritage-masonry': 'Coral-stone masonry, timber floors',
  scaffold: 'Façade retention scaffold',
};
