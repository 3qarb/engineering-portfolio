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
