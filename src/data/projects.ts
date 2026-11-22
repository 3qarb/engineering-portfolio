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
  {
    id: 'al-balad-restoration',
    kind: 'project',
    slug: 'jeddah-historic-district-restoration',
    title: 'Jeddah Historic District Restoration – Al-Balad',
    shortTitle: 'Al-Balad Restoration',
    category: 'Historic building restoration',
    location: 'Al-Balad, Jeddah, Saudi Arabia',
    client: '',
    period: '2025 – Present',
    status: 'in-progress',
    role: 'Technical Office Engineer, IKK Group – Essam Kabbani & Partners',
    summary: 'Technical office engineering on a restoration programme of more than 300 historic buildings.',
    thumbnail: '',
    images: [],
    overview:
      'The Jeddah Historic District Restoration Project covers the restoration and rehabilitation of more than 300 historic buildings in Al-Balad, the old centre of Jeddah and the core of the UNESCO World Heritage site “Historic Jeddah, the Gate to Makkah”. I work in the technical office of IKK Group – Essam Kabbani & Partners, where the structural information for the works is prepared, checked and coordinated.',
    engineeringContext:
      'Restoration work has two aims that pull against each other: make the building safe and usable again, and keep as much of its historic fabric and character as possible. The technical office turns that into drawings, calculations and submittals that the consultant can approve and the site can build.',
    existingConditions:
      'The buildings are traditional Red Sea construction: load-bearing coral-stone masonry walls in lime mortar, timber lintels and floor joists, and projecting timber roshan bays on the façades. Their condition varies from building to building, and drawings of the original structure rarely exist, so the existing structure has to be understood before repair, strengthening or temporary support is detailed.',
    scope: [
      'Structural shop drawings',
      'Assessment of existing buildings',
      'Strengthening and rehabilitation of masonry and timber structures',
      'Temporary works and scaffolding',
      'Steel supports and bracing',
      'Engineering calculations and technical reports',
      'Structural coordination and documentation',
    ],
    responsibilities: [
      'Preparing and reviewing structural shop drawings',
      'Structural analysis and calculations for existing buildings',
      'Strengthening and rehabilitation details for stone masonry and timber',
      'Timber beam and floor system checks',
      'Steel supports and bracing for temporary stabilisation',
      'Scaffolding calculations and drawings',
      'Diaphragm and load-distribution plans',
      'Structural reports, technical submittals and RFIs',
      'Coordination between the technical office, site engineers and restoration specialists',
    ],
    challenges: [
      'Historic coral stone and timber vary in strength and condition, and are rarely documented',
      'Every intervention has to respect the historic fabric of a protected site',
      'Narrow lanes and attached buildings limit access for temporary works and materials',
      'Many disciplines work on the same building, so drawings and submittals must stay consistent',
    ],
    structuralAssessment: '',
    methodology: '',
    solutions: [],
    technical: [
      { label: 'Programme', value: '300+ historic buildings' },
      { label: 'Construction', value: 'Coral-stone masonry, timber floors, roshan bays' },
      { label: 'Heritage status', value: 'UNESCO World Heritage, inscribed 2014' },
      { label: 'On the project since', value: '2025' },
    ],
    software: ['AutoCAD', 'ETABS', 'SAP2000', 'Revit', 'SAFE'],
    drawings: [
      'Structural shop drawings',
      'Temporary works and scaffolding drawings with calculations',
      'Steel support and bracing details',
      'Diaphragm and load-distribution plans',
      'Structural reports and technical submittals',
    ],
    featured: true,
    pending: [
      'Site photographs cleared for publication',
      'One building as a worked example: condition → assessment → solution',
      'A non-confidential sample drawing or calculation sheet',
      'Client and consultant names, if they may be published',
      'Software actually used on this project (confirm the list)',
    ],
  },
  {
    id: 'temporary-works-scaffolding',
    kind: 'study',
    slug: 'temporary-works-and-scaffolding',
    title: 'Temporary Works and Scaffolding',
    shortTitle: 'Temporary Works & Scaffolding',
    category: 'Temporary works',
    location: 'Illustrative study',
    client: '',
    period: '',
    status: 'study',
    summary: 'A façade-retention scaffold modelled member by member, with its erection sequence.',
    thumbnail: '',
    images: [],
    overview:
      'Temporary works keep a structure, and the people around it, safe while the permanent works are carried out. Scaffolding calculations and drawings are part of my technical office work. This study models a façade-retention scaffold so each tube, board and brace can be inspected in the explorer.',
    engineeringContext:
      'A façade scaffold is a structure in its own right: standards carry the platform loads to the ground, ledgers and transoms tie the bays together, and bracing gives it stiffness along the façade.',
    existingConditions: '',
    scope: ['Scaffolding layout and member sizing', 'Load path from working platform to base plate', 'Erection sequence by lift'],
    responsibilities: ['Scaffolding calculations and drawings', 'Steel supports and bracing for temporary stabilisation'],
    challenges: [],
    structuralAssessment: '',
    methodology: '',
    solutions: [],
    technical: [
      { label: 'System', value: 'Tube and fitting, façade-retention scaffold' },
      { label: 'Geometry', value: '4 bays × 2.5 m, 5 lifts × 2.0 m, 1.2 m wide' },
      { label: 'Tube', value: 'Ø48.3 × 4.0 mm, S235' },
      { label: 'Basis', value: 'Illustrative, typical dimensions' },
    ],
    software: ['SAP2000', 'AutoCAD'],
    drawings: [],
    featured: true,
  },
  {
    id: 'structural-strengthening',
    kind: 'study',
    slug: 'structural-strengthening',
    title: 'Structural Strengthening and Rehabilitation',
    shortTitle: 'Structural Strengthening',
    category: 'Structural strengthening',
    location: 'Illustrative study',
    client: '',
    period: '',
    status: 'study',
    summary: 'An existing RC frame with its columns jacketed, shown with the old and new sections.',
    thumbnail: '',
    images: [],
    overview:
      'Strengthening an existing structure starts from what is already there. This study shows a common case, a reinforced concrete column jacket, where the original section is enlarged with new concrete and reinforcement. Open any column in the explorer to see the existing core and the jacket drawn together.',
    engineeringContext:
      'Strengthening and rehabilitation of existing structures is one of my areas of work. The same questions apply to every case: what the existing member can carry, what it now has to carry, and how the new material will work with the old.',
    existingConditions: '',
    scope: ['Assessment of the existing section', 'Jacket sizing and reinforcement', 'Detailing the connection of new to existing'],
    responsibilities: ['Structural strengthening and rehabilitation details', 'Assessment of existing buildings'],
    challenges: [],
    structuralAssessment: '',
    methodology: '',
    solutions: [],
    technical: [
      { label: 'System', value: 'Existing RC frame, 5 storeys' },
      { label: 'Column', value: '300×300 existing → 450×450 jacketed' },
      { label: 'Jacket bars', value: '12T16, ties T8@100' },
      { label: 'Basis', value: 'Illustrative, typical dimensions' },
    ],
    software: ['ETABS', 'AutoCAD'],
    drawings: [],
    featured: true,
  },
  {
    id: 'structural-analysis-design',
    kind: 'study',
    slug: 'structural-analysis-and-design',
    title: 'Reinforced Concrete Frame — Analysis and Design',
    shortTitle: 'RC Frame Analysis & Design',
    category: 'Structural analysis and design',
    location: 'Illustrative study',
    client: '',
    period: '',
    status: 'study',
    summary: 'An eight-storey RC frame with column, beam, slab and footing sections you can open.',
    thumbnail: '',
    images: [],
    overview:
      'A reinforced concrete frame shown the way it is detailed: columns that change section up the building, beams, slabs and pad footings, each with its reinforcement. Click any member in the explorer to read its section and open the drawn cross-section.',
    engineeringContext:
      'Structural analysis and design of reinforced concrete is the base of my structural work. In a frame like this the model, the calculations and the shop drawings have to describe the same members.',
    existingConditions: '',
    scope: ['Frame layout and member sizing', 'Column, beam, slab and footing reinforcement', 'Quantity schedule from the model'],
    responsibilities: ['Structural analysis and design', 'Reinforced concrete detailing', 'Structural shop drawings'],
    challenges: [],
    structuralAssessment: '',
    methodology: '',
    solutions: [],
    technical: [
      { label: 'System', value: 'RC moment frame, 8 storeys × 3.4 m' },
      { label: 'Grid', value: '4 × 6.0 m by 3 × 5.5 m' },
      { label: 'Lower columns', value: '500×700, 16T25, T10@150' },
      { label: 'Basis', value: 'Illustrative, typical dimensions' },
    ],
    software: ['ETABS', 'SAFE', 'AutoCAD', 'Revit'],
    drawings: [],
    featured: true,
  },
];
