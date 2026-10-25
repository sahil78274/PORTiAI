/**
 * Canonical section list used by the editor, the templates and the analyzer.
 * `visibleSections` in the database always contains exactly these ids so that
 * render order and visibility stay consistent across clients.
 */
export const SECTION_DEFINITIONS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'achievements', label: 'Achievements & Certifications' },
  { id: 'contact', label: 'Contact' },
];

export const SECTION_IDS = SECTION_DEFINITIONS.map((section) => section.id);

export const TEMPLATE_IDS = ['minimal', 'developer', 'editorial'];

export const FONT_IDS = ['sans', 'serif', 'mono'];

export const defaultVisibleSections = () =>
  SECTION_DEFINITIONS.map((section, index) => ({
    id: section.id,
    label: section.label,
    visible: true,
    order: index,
  }));

export const defaultPortfolioContent = () => ({
  title: 'Untitled portfolio',
  templateId: 'minimal',
  profile: {
    fullName: '',
    title: '',
    bio: '',
    summary: '',
    location: '',
    contactEmail: '',
    photoUrl: '',
    links: [],
  },
  skills: [],
  education: [],
  projects: [],
  experience: [],
  achievements: [],
  socialLinks: { github: '', linkedin: '', twitter: '', website: '' },
  theme: { accent: '#2f4a8b', font: 'sans', density: 'comfortable' },
  visibleSections: defaultVisibleSections(),
});
