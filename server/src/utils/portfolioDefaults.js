import { readFileSync } from 'node:fs';

const catalogue = JSON.parse(
  readFileSync(new URL('../data/templateCatalogue.json', import.meta.url), 'utf8')
);

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
 * Every template shipped with the client. Generated from the client catalogue
 * by `scripts/sync-template-catalogue.mjs`, and verified by the API test suite,
 * so the ids can never drift away from the gallery.
 */
export const TEMPLATE_CATALOGUE = catalogue.templates;
export const TEMPLATE_IDS = TEMPLATE_CATALOGUE.map((template) => template.id);
export const PREMIUM_TEMPLATE_IDS = TEMPLATE_CATALOGUE.filter((template) => template.tier === 'premium').map(
  (template) => template.id
);
export const FREE_TEMPLATE_IDS = TEMPLATE_CATALOGUE.filter((template) => template.tier === 'free').map(
  (template) => template.id
);

export const isPremiumTemplateId = (id) => PREMIUM_TEMPLATE_IDS.includes(id);

/**
 * Ids shipped by earlier releases. They are kept in the database enum so that
 * existing documents still save, and normalizeTemplateId maps them onto a
 * current design.
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
export const TEMPLATE_DEFAULTS = Object.fromEntries(
  TEMPLATE_CATALOGUE.map((template) => [template.id, { accent: template.accent, font: template.font }])
);

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
  return ALL_TEMPLATE_IDS.includes(mapped) ? mapped : null;
};
