/** Areas of professional work, grouped the way a technical office divides it. No levels or percentages. */
export interface ExpertiseGroup {
  id: string;
  title: string;
  items: string[];
}

export const expertise: ExpertiseGroup[] = [
  {
    id: 'technical-office',
    title: 'Technical office',
    items: [
      'Structural shop drawings',
      'Engineering calculations and technical reports',
      'Structural coordination and documentation',
      'Technical submittals and RFIs',
    ],
  },
  {
    id: 'structural',
    title: 'Structural analysis and design',
    items: [
      'Structural analysis and design',
      'Reinforced concrete structures',
      'Steel supports and bracing systems',
      'Foundations and load distribution',
    ],
  },
  {
    id: 'existing',
    title: 'Existing and historic buildings',
    items: [
      'Existing building assessment',
      'Historic building restoration',
      'Structural strengthening and rehabilitation',
      'Timber and masonry structures',
    ],
  },
  {
    id: 'temporary',
    title: 'Temporary works',
    items: ['Scaffolding design and calculations', 'Temporary propping and stabilisation', 'Façade support during restoration'],
  },
];

export interface SoftwareEntry {
  name: string;
  /** What the program is used for in structural work */
  use: string;
}

export const software: SoftwareEntry[] = [
  { name: 'AutoCAD', use: 'Shop drawings, details and coordination drawings' },
  { name: 'ETABS', use: 'Building analysis models' },
  { name: 'SAP2000', use: 'General structural and temporary-works analysis' },
  { name: 'SAFE', use: 'Slab and foundation analysis' },
  { name: 'Revit', use: 'BIM models and coordination' },
];
