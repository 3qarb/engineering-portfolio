export interface ProjectEntry {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  location: string;
  client: string;
  period: string;
  status: 'completed' | 'in-progress' | 'ongoing';
  thumbnail: string;
  images: string[];
  overview: string;
  engineeringContext: string;
  responsibilities: string[];
  challenges: string[];
  structuralAssessment: string;
  methodology: string;
  solutions: string[];
  software: string[];
  drawings: string[];
  featured: boolean;
  /** Your role on the project, one line */
  role?: string;
  /** Optional cover image (URL or data URL) */
  cover?: string;
}

export const projects: ProjectEntry[] = [
  {
    id: 'al-balad-restoration',
    role: 'Technical Office Engineer',
    slug: 'jeddah-historic-district-restoration',
    title: 'Jeddah Historic District Restoration – Al-Balad',
    shortTitle: 'Al-Balad Restoration',
    category: 'Historic Building Restoration',
    location: 'Jeddah, Saudi Arabia',
    client: 'Ministry of Culture, Saudi Arabia',
    period: '2022 – Present',
    status: 'in-progress',
    thumbnail: '/images/projects/al-balad/thumbnail.jpg',
    images: [
      '/images/projects/al-balad/01-overview.jpg',
      '/images/projects/al-balad/02-stone-masonry.jpg',
      '/images/projects/al-balad/03-timber-structure.jpg',
      '/images/projects/al-balad/04-strengthening.jpg',
      '/images/projects/al-balad/05-before-after.jpg',
    ],
    overview: `The Jeddah Historic District (Al-Balad) Restoration Project is a comprehensive heritage conservation initiative encompassing the restoration and rehabilitation of over 300 historic buildings in the UNESCO World Heritage site of Al-Balad, Jeddah. The project aims to preserve the architectural and historical character of these structures while adapting them for contemporary cultural, public, and tourism use.`,
    engineeringContext: `Al-Balad's historic buildings date back to the 7th century and represent traditional Red Sea architecture characterized by coral stone masonry (kashir), timber structural systems (rawashin and mashrabiyas), and lime-based mortars. The buildings have suffered from decades of neglect, environmental exposure, and inappropriate interventions, requiring careful structural assessment and sensitive strengthening approaches.`,
    responsibilities: [
      'Structural assessment of 300+ historic buildings using non-destructive testing methods',
      'Preparation of structural shop drawings for coral stone masonry repair and reconstruction',
      'Design of timber beam and floor system repairs using traditional joinery techniques',
      'Structural strengthening design using reversible, compatible materials (lime-based grouts, stainless steel anchors)',
      'Temporary works design including propping, shoring, and scaffolding for facade retention',
      'Coordination with conservation architects, material scientists, and heritage authorities',
      'Technical submittals and method statements for Ministry of Culture approval',
      'On-site structural supervision and RFI resolution during construction',
    ],
    challenges: [
      'Highly variable existing material properties in coral stone and historic timber',
      'Limited access for inspection in dense urban fabric',
      'Balancing structural safety with heritage conservation principles (reversibility, compatibility)',
      'Seismic upgrading of unreinforced masonry without compromising historic fabric',
      'Coordination of multiple trades working simultaneously in confined spaces',
    ],
    structuralAssessment: `Comprehensive structural assessment included: visual condition surveys, Schmidt hammer testing on coral stone, moisture content measurement in timber, endoscopic investigation of wall cores, and 3D laser scanning for deformation monitoring. Structural modeling in ETABS and SAP2000 was performed for representative building typologies to assess load paths and strengthening effectiveness.`,
    methodology: `The strengthening methodology follows the principles of minimal intervention and compatibility: (1) Consolidation of decayed stone using nano-lime dispersions, (2) Crack stitching with helical stainless steel bars, (3) Timber repair using scarf joints and epoxy-resin reinforcement where appropriate, (4) Installation of discrete steel moment frames for lateral resistance, (5) Lime-based grout injection for void filling and diaphragm action restoration.`,
    solutions: [
      'Developed a typological strengthening approach applicable across 300+ buildings',
      'Designed reversible stainless steel anchoring systems for facade retention',
      'Implemented timber repair protocols using traditional carpentry joints',
      'Established structural monitoring program with crack gauges and tilt sensors',
      'Created standardized shop drawing templates for accelerated approval',
    ],
    software: ['AutoCAD', 'ETABS', 'SAP2000', 'Revit', 'Rhino/Grasshopper'],
    drawings: [
      'Structural assessment reports (300+ buildings)',
      'Shop drawings for stone masonry repair',
      'Timber connection details and repair drawings',
      'Temporary works and scaffolding designs',
      'Strengthening details – steel frames, anchors, grout injection',
      'Diaphragm and load distribution plans',
      'As-built documentation for completed phases',
    ],
    featured: true,
  },
  {
    id: 'structural-analysis-design',
    role: 'Structural Design Engineer',
    slug: 'structural-analysis-and-design',
    title: 'Structural Analysis and Design Portfolio',
    shortTitle: 'Structural Analysis & Design',
    category: 'Structural Analysis and Design',
    location: 'Various Projects',
    client: 'Multiple Clients',
    period: '2020 – Present',
    status: 'ongoing',
    thumbnail: '/images/projects/structural-analysis/thumbnail.jpg',
    images: [
      '/images/projects/structural-analysis/01-etabs-model.jpg',
      '/images/projects/structural-analysis/02-timber-verification.jpg',
      '/images/projects/structural-analysis/03-steel-connections.jpg',
      '/images/projects/structural-analysis/04-load-distribution.jpg',
    ],
    overview: `A collection of structural analysis and design projects demonstrating proficiency in modeling, calculation, and detailing across reinforced concrete, structural steel, and timber systems. Projects range from new construction to existing building assessment.`,
    engineeringContext: `Structural analysis projects require accurate modeling of load paths, material behavior, and connection performance. Work includes linear and non-linear analysis, seismic design per SBC/ASCE 7, and connection design per AISC/EC3.`,
    responsibilities: [
      '3D structural modeling in ETABS and SAP2000 for multi-story buildings',
      'Timber beam and column verification per NDS/EC5',
      'Reinforced concrete member design per ACI 318/SBC 304',
      'Steel connection design (moment, shear, bracing) per AISC 360',
      'Foundation design including shallow and deep foundations',
      'Load take-down and distribution analysis',
      'Structural calculation reports for authority submission',
    ],
    challenges: [
      'Modeling complex irregular geometries and load paths',
      'Soil-structure interaction for foundation design',
      'Seismic analysis for high-seismicity regions',
      'Connection design optimization for constructability',
    ],
    structuralAssessment: `Analysis includes gravity and lateral load assessment, drift control, P-delta effects, and modal analysis. Results validated through hand calculations and peer review.`,
    methodology: `Finite element modeling with appropriate element types, mesh refinement at critical regions, load combination per applicable codes, and result verification through simplified methods.`,
    solutions: [
      'Optimized structural systems reducing material quantities by 15-20%',
      'Standardized calculation templates for common design scenarios',
      'Automated drawing generation from analysis models',
    ],
    software: ['ETABS', 'SAP2000', 'AutoCAD', 'Revit', 'SAFE', 'ROBOT'],
    drawings: [
      'Structural calculation packages',
      'General arrangement drawings',
      'Reinforcement detailing',
      'Steel connection details',
      'Foundation layout and details',
    ],
    featured: true,
  },
  {
    id: 'temporary-works-scaffolding',
    role: 'Temporary Works Designer',
    slug: 'temporary-works-and-scaffolding',
    title: 'Temporary Works and Scaffolding Design',
    shortTitle: 'Temporary Works & Scaffolding',
    category: 'Temporary Works and Scaffolding',
    location: 'Various Sites, Saudi Arabia',
    client: 'Multiple Contractors',
    period: '2021 – Present',
    status: 'ongoing',
    thumbnail: '/images/projects/temporary-works/thumbnail.jpg',
    images: [
      '/images/projects/temporary-works/01-scaffolding-system.jpg',
      '/images/projects/temporary-works/02-cantilever-design.jpg',
      '/images/projects/temporary-works/03-facade-retention.jpg',
    ],
    overview: `Design of temporary works systems for construction, renovation, and heritage projects. Includes access scaffolding, facade retention schemes, propping and shoring, and cantilever platforms. All designs comply with BS 5975, NASC TG20, and local regulations.`,
    engineeringContext: `Temporary works are critical for construction safety and sequence. Designs must account for construction loads, wind loading, impact, and progressive collapse prevention. Heritage projects require specialized facade retention systems that protect historic fabric.`,
    responsibilities: [
      'System scaffold design per TG20 (tube & fitting, system scaffolds)',
      'Cantilever scaffold design for restricted access areas',
      'Facade retention schemes for historic building preservation',
      'Propping and shoring calculations for excavation support',
      'Temporary roof and weather protection structures',
      'Scaffold inspection and tagging procedures',
      'Method statements and risk assessments',
    ],
    challenges: [
      'Designing for variable ground conditions and limited foundation capacity',
      'Cantilever scaffolds with high moment demands',
      'Facade retention without anchoring into historic fabric',
      'Coordination with construction sequence and crane operations',
    ],
    structuralAssessment: `Load assessment includes: dead load (scaffold self-weight), live load (personnel, materials), wind load per ASCE 7/BS EN 1991, and environmental loads. Stability checks include overturning, sliding, and base capacity.`,
    methodology: `Structural analysis using SAP2000 for complex scaffolds, hand calculations for standard configurations per TG20, and connection design for proprietary systems.`,
    solutions: [
      'Modular scaffold design system for rapid deployment',
      'Innovative facade retention using needle beams and raking shores',
      'Digital scaffold tagging and inspection tracking system',
    ],
    software: ['AutoCAD', 'SAP2000', 'ScaffCalc', 'TG20 eGuide'],
    drawings: [
      'Scaffold general arrangement drawings',
      'Cantilever scaffold design calculations',
      'Facade retention scheme details',
      'Propping and shoring layouts',
      'Inspection and tagging schedules',
    ],
    featured: true,
  },
  {
    id: 'structural-strengthening',
    role: 'Strengthening Design Engineer',
    slug: 'structural-strengthening',
    title: 'Structural Strengthening and Rehabilitation',
    shortTitle: 'Structural Strengthening',
    category: 'Structural Strengthening',
    location: 'Jeddah, Saudi Arabia',
    client: 'Various Building Owners',
    period: '2020 – Present',
    status: 'ongoing',
    thumbnail: '/images/projects/strengthening/thumbnail.jpg',
    images: [
      '/images/projects/strengthening/01-steel-bracing.jpg',
      '/images/projects/strengthening/02-foundation-support.jpg',
      '/images/projects/strengthening/03-leaning-building.jpg',
    ],
    overview: `Structural strengthening projects for existing buildings exhibiting distress, settlement, or requiring seismic upgrading. Solutions include steel bracing systems, foundation underpinning, jacketing, FRP wrapping, and load redistribution schemes.`,
    engineeringContext: `Existing buildings in Jeddah face challenges from differential settlement, corrosion of reinforcement, and inadequate lateral systems. Strengthening must be designed for minimal disruption to occupants and compatibility with existing structural systems.`,
    responsibilities: [
      'Condition assessment and structural diagnosis of distressed buildings',
      'Steel bracing and moment frame design for lateral strengthening',
      'Foundation underpinning and micro-pile design',
      'RC jacketing and FRP strengthening design',
      'Load redistribution analysis for vertical additions',
      'Construction sequencing for occupied building strengthening',
      'Monitoring programs during and after strengthening',
    ],
    challenges: [
      'Working in occupied buildings with minimal disruption',
      'Unknown existing reinforcement details',
      'Corrosion-damaged concrete requiring extensive repair',
      'Seismic upgrading of non-ductile frames',
    ],
    structuralAssessment: `Assessment includes: concrete core testing, cover meter surveys, half-cell potential mapping, structural monitoring (crack, tilt, settlement), and non-linear pushover analysis for seismic evaluation.`,
    methodology: `Performance-based design per ASCE 41/EC8, compatibility checks for new-old material interface, staged construction analysis, and durability design for 50+ year service life.`,
    solutions: [
      'External steel bracing systems with minimal architectural impact',
      'Micro-pile underpinning for foundation settlement correction',
      'CFRP wrapping for shear and flexural strengthening',
      'Post-tensioned flat slab strengthening for load increase',
    ],
    software: ['AutoCAD', 'ETABS', 'SAP2000', 'PROKON', 'CSI COL'],
    drawings: [
      'Strengthening general arrangements',
      'Steel bracing connection details',
      'Jacketing and FRP application details',
      'Underpinning sequence drawings',
      'Monitoring instrumentation plans',
    ],
    featured: true,
  },
];

