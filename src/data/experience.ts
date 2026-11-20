export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  project?: string;
  summary?: string;
  responsibilities: string[];
  technologies?: string[];
}

/**
 * Professional experience, newest first.
 * To add a previous role, copy this shape (dates as "2023" or "Mar 2023"):
 * { id: 'company-slug', company: '', position: '', location: '', startDate: '', endDate: '',
 *   current: false, responsibilities: [''], technologies: [''] }
 */
export const experience: ExperienceEntry[] = [
  {
    id: 'ikk-group',
    company: 'IKK Group – Essam Kabbani & Partners',
    position: 'Technical Office Engineer',
    location: 'Jeddah, Saudi Arabia',
    startDate: '2025',
    endDate: 'Present',
    current: true,
    project: 'Jeddah Historic District Restoration Project – Al-Balad',
    summary:
      'Technical office engineering on the restoration and rehabilitation of more than 300 historic buildings in Al-Balad.',
    responsibilities: [
      'Preparing and reviewing structural shop drawings for restoration and rehabilitation works',
      'Reinforced concrete and foundation detailing where new structure is introduced',
      'Structural analysis and calculations for the assessment of existing buildings',
      'Strengthening and rehabilitation details for stone masonry and timber structures',
      'Timber beam and floor system checks for traditional construction',
      'Steel supports and bracing for temporary stabilisation',
      'Temporary works design: scaffolding calculations and drawings',
      'Diaphragm and load-distribution plans',
      'Ceiling (RCP) and slab coordination, including wet areas',
      'Structural reports and technical submittals',
      'RFIs and technical coordination with the consultant',
      'Coordination between the technical office, site engineers and restoration specialists',
    ],
    technologies: ['AutoCAD', 'ETABS', 'SAP2000', 'Revit', 'SAFE'],
  },
];
