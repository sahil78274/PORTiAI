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

/**
 * Every template shipped with the client. The order here is the order used by
 * the gallery, and the ids must stay in sync with
 * client/src/utils/templates.js (verified by the template test suite).
 */
export const TEMPLATE_IDS = [
  'minimal',
  'developer',
  'editorial',
  'obsidian',
  'aurora',
  'swiss',
  'neon',
  'editorialpro',
  'executive',
];

/** Default accent + font for each template, applied when one is first chosen. */
export const TEMPLATE_DEFAULTS = {
  minimal: { accent: '#2f4a8b', font: 'serif' },
  developer: { accent: '#1f5c4a', font: 'mono' },
  editorial: { accent: '#8a3a2f', font: 'serif' },
  obsidian: { accent: '#8b5cf6', font: 'sans' },
  aurora: { accent: '#6366f1', font: 'sans' },
  swiss: { accent: '#111111', font: 'sans' },
  neon: { accent: '#22d3ee', font: 'mono' },
  editorialpro: { accent: '#b45309', font: 'serif' },
  executive: { accent: '#0f2a52', font: 'serif' },
};

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
  blog: { enabled: false, title: '', intro: '' },
});

/** Accepts legacy/descriptive aliases and returns a canonical template id. */
export const normalizeTemplateId = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.toLowerCase().trim();
  const aliases = {
    'minimal-professional': 'minimal',
    'developer-portfolio': 'developer',
    'modern-editorial': 'editorial',
    'obsidian-pro': 'obsidian',
    'aurora-gradient': 'aurora',
    'swiss-minimal': 'swiss',
    'neon-terminal': 'neon',
    'editorial-pro': 'editorialpro',
    'executive-elite': 'executive',
  };
  const mapped = aliases[clean] || clean;
  return TEMPLATE_IDS.includes(mapped) ? mapped : null;
};
