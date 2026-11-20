export interface SkillCategory {
  id: string;
  title: string;
  icon: string;
  skills: Skill[];
}

export interface Skill {
  name: string;
  level: 'expert' | 'advanced' | 'proficient' | 'familiar';
  description?: string;
}

export const skillCategories: SkillCategory[] = [
  {
    id: 'engineering-software',
    title: 'Engineering Software',
    icon: 'Monitor',
    skills: [
      { name: 'AutoCAD', level: 'expert', description: '2D drafting, 3D modeling, parametric constraints, sheet sets' },
      { name: 'ETABS', level: 'expert', description: '3D structural modeling, linear/non-linear analysis, seismic design, API automation' },
      { name: 'SAP2000', level: 'advanced', description: 'Complex structural analysis, bridge modeling, staged construction, pushover analysis' },
      { name: 'Revit', level: 'advanced', description: 'BIM coordination, structural families, worksharing, Dynamo automation' },
      { name: 'SAFE', level: 'proficient', description: 'Foundation and slab design, post-tensioning, punching shear' },
      { name: 'ROBOT Structural Analysis', level: 'proficient', description: 'Steel design, connection design, code checking' },
      { name: 'PROKON', level: 'proficient', description: 'Structural analysis suite, foundation design, retaining walls' },
    ],
  },
  {
    id: 'structural-engineering',
    title: 'Structural Engineering',
    icon: 'Building',
    skills: [
      { name: 'Structural Analysis', level: 'expert', description: 'Linear/non-linear, static/dynamic, seismic, wind, P-delta, buckling' },
      { name: 'Reinforced Concrete Design', level: 'expert', description: 'ACI 318, SBC 304, EC2 – beams, columns, slabs, walls, foundations' },
      { name: 'Structural Steel Design', level: 'advanced', description: 'AISC 360, EC3 – members, connections, bracing, composite design' },
      { name: 'Timber Structures', level: 'advanced', description: 'NDS, EC5 – glulam, CLT, traditional joinery, historic timber repair' },
      { name: 'Masonry Structures', level: 'advanced', description: 'TMS 402, EC6 – unreinforced/reinforced, historic masonry assessment' },
      { name: 'Foundation Systems', level: 'advanced', description: 'Shallow/deep foundations, piles, micro-piles, rafts, underpinning' },
      { name: 'Structural Strengthening', level: 'expert', description: 'FRP, steel jacketing, post-tensioning, external bracing, underpinning' },
    ],
  },
  {
    id: 'technical-office',
    title: 'Technical Office',
    icon: 'FileText',
    skills: [
      { name: 'Structural Shop Drawings', level: 'expert', description: 'Reinforcement detailing, steel fabrication, connection details, BIM coordination' },
      { name: 'Technical Submittals', level: 'expert', description: 'Calculation packages, method statements, material submittals, authority approvals' },
      { name: 'RFIs & Technical Coordination', level: 'expert', description: 'Design clarification, site coordination, consultant liaison, change management' },
      { name: 'Method Statements', level: 'advanced', description: 'Construction sequencing, risk assessment, quality control, safety planning' },
      { name: 'Quantity Take-offs', level: 'advanced', description: 'Concrete, steel, formwork, BOQ preparation, cost estimation support' },
      { name: 'As-Built Drawings', level: 'advanced', description: 'Field verification, redline markup, digital handover, BIM as-built' },
      { name: 'Technical Reports', level: 'expert', description: 'Structural assessment, condition survey, feasibility, expert witness' },
      { name: 'Construction Coordination', level: 'advanced', description: 'Multi-discipline coordination, clash detection, site supervision, progress tracking' },
    ],
  },
];

export const iconMap: Record<string, string> = {
  Monitor: 'Monitor',
  Building: 'Building',
  FileText: 'FileText',
};