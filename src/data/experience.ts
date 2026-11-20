export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  project?: string;
  client?: string;
  responsibilities: string[];
  technologies?: string[];
}

export const experience: ExperienceEntry[] = [
  {
    id: 'ikk-group',
    company: 'IKK Group – Essam Kabbani & Partners',
    position: 'Technical Office Engineer',
    location: 'Jeddah, Saudi Arabia',
    startDate: '2022',
    endDate: 'Present',
    current: true,
    project: 'Jeddah Historic District Restoration Project – Al-Balad',
    client: 'Ministry of Culture, Saudi Arabia',
    responsibilities: [
      'Preparing and reviewing structural shop drawings for historic building restoration',
      'Reinforced concrete and foundation detailing for rehabilitation works',
      'RCP and slab coordination, including wet-area considerations',
      'Structural calculations using ETABS and SAP2000 for existing building assessment',
      'Structural strengthening and rehabilitation design for historic stone masonry structures',
      'Timber beam and floor system analysis for traditional construction',
      'Steel supports and bracing systems design for temporary stabilization',
      'Temporary structural works design including scaffolding calculations and drawings',
      'Diaphragm and load-distribution plans for seismic upgrading',
      'Structural reports and technical submissions for authority approvals',
      'RFI management and technical coordination with consultants',
      'Coordination between technical office teams, site engineers, and restoration specialists',
    ],
    technologies: ['AutoCAD', 'ETABS', 'SAP2000', 'Revit', 'Microsoft Office'],
  },
  {
    id: 'previous-1',
    company: '[Previous Company Name]',
    position: '[Previous Position]',
    location: '[City, Country]',
    startDate: '[Start Date]',
    endDate: '[End Date]',
    current: false,
    responsibilities: [
      '[Responsibility 1 - Add your experience here]',
      '[Responsibility 2 - Add your experience here]',
      '[Responsibility 3 - Add your experience here]',
    ],
    technologies: ['[Technology 1]', '[Technology 2]'],
  },
  {
    id: 'previous-2',
    company: '[Previous Company Name]',
    position: '[Previous Position]',
    location: '[City, Country]',
    startDate: '[Start Date]',
    endDate: '[End Date]',
    current: false,
    responsibilities: [
      '[Responsibility 1 - Add your experience here]',
      '[Responsibility 2 - Add your experience here]',
      '[Responsibility 3 - Add your experience here]',
    ],
    technologies: ['[Technology 1]', '[Technology 2]'],
  },
];

