export type ProjectKind = 'project' | 'study';

export interface Figure {
  src: string;
  alt: string;
  caption?: string;
}

export interface ProjectEntry {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  /** Project type, used for filtering */
  category: string;
  location: string;
  client: string;
  period: string;
  status: 'completed' | 'in-progress' | 'ongoing' | 'study';
  /** A delivered project, or an illustrative technical study built from typical values */
  kind?: ProjectKind;
  /** One line for lists and cards */
  summary?: string;
  thumbnail: string;
  images: string[];
  gallery?: Figure[];
  overview: string;
  engineeringContext: string;
  existingConditions?: string;
  scope?: string[];
  responsibilities: string[];
  challenges: string[];
  structuralAssessment: string;
  methodology: string;
  solutions: string[];
  technical?: { label: string; value: string }[];
  software: string[];
  drawings: string[];
  featured: boolean;
  /** Your role on the project, one line */
  role?: string;
  /** Optional cover image (URL or data URL) */
  cover?: string;
  /** Content still to be supplied — shown only in development builds */
  pending?: string[];
}

/**
 * Built-in projects. Only facts the owner has confirmed belong here.
 * `kind: 'study'` entries are illustrative: their 3D models use typical member sizes.
 */
export const projects: ProjectEntry[] = [
  {
    id: 'villa-structural-design',
    kind: 'project',
    slug: 'residential-villa-structural-design',
    title: 'Residential Villa — Structural Design',
    shortTitle: 'Residential Villa',
    category: 'Structural analysis and design',
    location: '',
    client: 'Private client',
    period: '2026',
    status: 'completed',
    role: 'Structural engineer: analysis model, foundation design and structural drawings',
    summary: 'A reinforced concrete villa, from the ETABS and SAFE models to a 19-sheet structural drawing set. Architecture by others.',
    thumbnail: '',
    images: [],
    overview:
      'Structural design of a reinforced concrete villa about 30 × 30 m in plan, with neck columns and ground beams, a ground floor, a first floor and an upper roof annex. The architecture was by others; my work was the structure: the analysis model, the foundation design and the structural drawings. The 3D model on this page is imported from the analysis model, member by member.',
    engineeringContext:
      'The structure is a reinforced concrete frame with 200 mm wide columns set within the walls, dropped beams, and floors that mix solid slabs, 320 mm hollow-block ribbed slabs and hidden beams within the slab depth. Footings are isolated and combined pads tied together by strap and ground beams. The drawings state that the design follows the Saudi Building Code.',
    scope: [
      'Three-dimensional ETABS model of the frame, slabs and diaphragms',
      'Dead, live, wind and seismic load cases and their combinations',
      'Column, beam, hidden-beam and rib design and schedules',
      'SAFE model of the isolated and combined footings on soil springs',
      'Structural drawings S-201 to S-219: notes, foundations, columns, ground beams, framing plans, schedules and details',
    ],
    responsibilities: [
      'Built and analysed the ETABS model (ETABS v20.3)',
      'Designed the footings in SAFE, with strap beams for edge columns',
      'Sized and scheduled columns C1–C5, beams B1–B5, hidden beams HB1–HB5 and ribs R1–R8',
      'Prepared the structural drawing set, 19 sheets',
    ],
    challenges: [
      'Columns only 200 mm wide, set inside the walls, with a 4.05 m ground storey above the neck columns',
      'Three floor systems in one building: solid slabs, hollow-block ribbed slabs and hidden beams',
      'Columns close together, combined footings and an elevator pit in the foundation layout',
    ],
    structuralAssessment:
      'Analysis model: rigid diaphragm at each level, cracked-section stiffness for beams (0.35) and columns (0.75), wind and equivalent static seismic load cases, and factored load combinations. Footings were checked in SAFE with the column loads from ETABS, on area springs.',
    methodology: '',
    solutions: [
      'Isolated footings F1–F3 and combined footings C-F1–C-F3, 600 mm thick, tied with strap and ground beams',
      'Columns 200 × 400 to 200 × 900, reinforced 4T14 to 16T16, oriented with the walls',
      'Hollow-block slabs 320 mm deep with 150 mm ribs at 550 mm, and hidden beams 400–1000 mm wide where spans or openings need them',
    ],
    technical: [
      { label: 'Plan grid', value: '29.8 × 30.0 m (S-202)' },
      { label: 'Levels (analysis model)', value: 'Base −1.50 · G.B +0.65 · G.F +4.70 · F.F +8.60 · R.F +12.00' },
      { label: 'Model', value: '155 column segments · 218 beams · 67 slab panels' },
      { label: 'Columns', value: '200 × 400 to 200 × 900 · 4T14 to 16T16' },
      { label: 'Floors', value: 'Solid 150 / 200 mm · hollow block 320 mm' },
      { label: 'Footings', value: '600 mm thick · 1.5 × 1.2 m to 3.2 × 2.9 m' },
      { label: 'Materials', value: "f'c 30 MPa · fy 420 MPa" },
      { label: 'Software', value: 'ETABS v20.3 · SAFE v22 · AutoCAD' },
    ],
    software: ['ETABS', 'SAFE', 'AutoCAD'],
    drawings: [
      'S-201 General notes and design criteria',
      'S-202 Foundations plan · S-203 Footing schedule and details',
      'S-204 Neck columns · S-205 Column schedule',
      'S-206 Ground beams plan · S-207 Ground and strap beam schedule',
      'S-209 / S-213 / S-215 Column layouts by floor',
      'S-210 / S-214 / S-216 Ceiling reinforcement plans',
      'S-211 / S-212 Beam, hidden beam and rib schedules',
      'S-208, S-217–S-219 Stair, slab, beam and footing details',
    ],
    gallery: [
      { src: '/images/projects/villa/s-202-foundations-plan.jpg', alt: 'Structural drawing S-202: foundations plan with isolated and combined footings and strap beams', caption: 'S-202 Foundations plan' },
      { src: '/images/projects/villa/s-210-ground-ceiling.jpg', alt: 'Structural drawing S-210: ground floor ceiling reinforcement plan with beams, hollow-block slabs and hidden beams', caption: 'S-210 Ground ceiling' },
      { src: '/images/projects/villa/s-214-first-ceiling.jpg', alt: 'Structural drawing S-214: first floor ceiling reinforcement plan', caption: 'S-214 First ceiling' },
      { src: '/images/projects/villa/s-205-column-schedule.jpg', alt: 'Structural drawing S-205: schedule of column sections C1 to C5 with reinforcement', caption: 'S-205 Column schedule' },
      { src: '/images/projects/villa/s-212-beam-schedule.jpg', alt: 'Structural drawing S-212: schedules of dropped beams, hidden beams and ribs', caption: 'S-212 Beam schedules' },
    ],
    featured: true,
    pending: [
      'City, and whether the villa has been built',
      'Permission to publish the drawing sheets (title blocks are blank)',
      'Resolve the model/drawing review items in docs/VILLA_REVIEW.md before sharing the drawings widely',
    ],
  },
];
