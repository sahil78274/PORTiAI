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
export const TEMPLATE_IDS = ['developer', 'dark', 'designer', 'student', 'freelancer', 'executive'];

/**
 * Ids shipped by earlier releases. They are kept in the database enum so that
 * existing documents still save, and normalizeTemplateId maps them onto the
 * current six designs.
 */
export const LEGACY_TEMPLATE_IDS = [
  'minimal',
  'editorial',
  'obsidian',
  'aurora',
  'swiss',
  'neon',
  'editorialpro',
];

/** Every id the database may contain. */
export const ALL_TEMPLATE_IDS = [...new Set([...TEMPLATE_IDS, ...LEGACY_TEMPLATE_IDS])];

/** Default accent + font for each template, applied when one is first chosen. */
export const TEMPLATE_DEFAULTS = {
  developer: { accent: '#2563eb', font: 'sans' },
  dark: { accent: '#8ab4f8', font: 'sans' },
  designer: { accent: '#8a4b32', font: 'serif' },
  student: { accent: '#2f6f8f', font: 'sans' },
  freelancer: { accent: '#215b7a', font: 'sans' },
  executive: { accent: '#8a6a3b', font: 'serif' },
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
  templateId: 'developer',
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
  theme: { accent: '#2563eb', font: 'sans', density: 'comfortable' },
  visibleSections: defaultVisibleSections(),
  blog: { enabled: false, title: '', intro: '' },
});

/**
 * Accepts legacy ids and descriptive slugs and returns a canonical template id.
 * Returns null when the input is empty or unrecognised, so callers can decide
 * whether to fall back or reject.
 */
const TEMPLATE_ALIASES = {
  'minimal-professional': 'student',
  minimal: 'student',
  editorial: 'designer',
  'modern-editorial': 'designer',
  obsidian: 'dark',
  'obsidian-pro': 'dark',
  aurora: 'designer',
  'aurora-gradient': 'designer',
  swiss: 'executive',
  'swiss-minimal': 'executive',
  neon: 'dark',
  'neon-terminal': 'dark',
  editorialpro: 'designer',
  'editorial-pro': 'designer',
  'executive-elite': 'executive',
  'developer-portfolio': 'developer',
  'dark-professional': 'dark',
  'creative-designer': 'designer',
  'student-portfolio': 'student',
  'modern-freelancer': 'freelancer',
  'executive-portfolio': 'executive',
};

export const normalizeTemplateId = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.toLowerCase().trim();
  const mapped = TEMPLATE_ALIASES[clean] || clean;
  return TEMPLATE_IDS.includes(mapped) ? mapped : null;
};
