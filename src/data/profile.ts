/**
 * Who the site is about. Every value here is shown publicly.
 * A value containing "example." is a placeholder: the UI hides it (or says the channel is not
 * configured) until a real one is filled in. See docs/PROJECT_PROGRESS.md → Content needed.
 */
export const profile = {
  name: 'Abdulaziz Ahmed Kanaan',
  shortName: 'Abdulaziz Kanaan',
  title: 'Civil Engineer | Technical Office Engineer | Structural Engineer',
  titles: ['Civil Engineer', 'Technical Office Engineer', 'Structural Engineer'],
  positioning:
    'Technical office and structural engineering on the Jeddah Historic District restoration in Al-Balad, a programme of more than 300 historic buildings: shop drawings, calculations, temporary works and the coordination behind them.',
  introduction:
    'A civil engineer working in technical office and structural engineering, with a focus on existing and historic buildings.',
  location: 'Jeddah, Saudi Arabia',
  email: 'azooz.msf@gmail.com',
  phone: '',
  /** Set `verified: true` once the address is confirmed; unverified links are not shown. */
  links: {
    linkedin: { url: 'https://www.linkedin.com/in/abdulaziz-kanaan', verified: false },
  },
  cvUrl: '/cv.pdf',
  currentCompany: {
    name: 'IKK Group – Essam Kabbani & Partners',
    position: 'Technical Office Engineer',
    location: 'Jeddah, Saudi Arabia',
    project: 'Jeddah Historic District Restoration Project – Al-Balad',
    startDate: '2025',
    endDate: 'Present',
  },
  about: {
    paragraphs: [
      'I am a civil engineer working as a Technical Office Engineer with IKK Group – Essam Kabbani & Partners in Jeddah. Since 2025 I have worked on the Jeddah Historic District Restoration Project in Al-Balad, which covers the restoration and rehabilitation of more than 300 historic buildings.',
      'My work sits between design and site: structural shop drawings, engineering calculations and technical reports, the assessment of existing structures, and the temporary works, steel supports and bracing that keep a building stable while it is repaired.',
      'Historic Al-Balad buildings are coral-stone masonry with timber floors and timber roshan façades. Most were never drawn, so the existing structure has to be understood before any intervention is detailed, and the drawings have to be clear enough for the consultant, the site team and the restoration specialists to work from the same information.',
    ],
    interests: [
      'Historic building restoration and rehabilitation',
      'Structural strengthening of existing structures',
      'Timber and masonry structural systems',
      'Technical office engineering and coordination',
      'Temporary works and scaffolding',
    ],
  },
  /** Content still to be supplied by the owner (shown only in development). */
  pending: ['Education (degree, university, year)', 'Professional registration (e.g. Saudi Council of Engineers)', 'Languages', 'Phone (optional)', 'LinkedIn address'],
};

export type Profile = typeof profile;

export const isPlaceholder = (v?: string) => !v || /example\./i.test(v);
