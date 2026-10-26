/**
 * Template registry shared by the gallery, the editor and the renderer.
 * The ids must match server/src/utils/portfolioDefaults.js TEMPLATE_IDS.
 *
 * Six templates, each with its own layout system rather than a recolour.
 * Earlier releases shipped different ids; those are mapped by ALIASES so
 * existing portfolios keep rendering after the rename.
 */
export const TEMPLATES = [
  {
    id: 'developer',
    name: 'Minimal Developer',
    tagline: 'A clean engineering portfolio that puts the work first.',
    description:
      'White canvas, dark type and a single blue accent. A short introduction, then project entries as readable rows with stack tags and links. No decoration between you and the content.',
    bestFor: 'Software engineers and technical students',
    categories: ['Developer', 'Professional'],
    accent: '#2563eb',
    tone: 'light',
    traits: ['Project rows', 'Stack tags', 'Compact header'],
    swatches: ['#ffffff', '#1a1d21', '#2563eb'],
  },
  {
    id: 'dark',
    name: 'Dark Professional',
    tagline: 'Charcoal surfaces with restrained contrast.',
    description:
      'A dark canvas for people who work in dark environments. Large name treatment, a sticky details column and wide project sections with muted rules instead of cards.',
    bestFor: 'Senior engineers and technical leads',
    categories: ['Developer', 'Professional'],
    accent: '#8ab4f8',
    tone: 'dark',
    traits: ['Sticky details', 'Wide project sections', 'Muted dividers'],
    swatches: ['#16181c', '#e9e9e4', '#8ab4f8'],
  },
  {
    id: 'designer',
    name: 'Creative Designer',
    tagline: 'An editorial layout for visual work.',
    description:
      'Warm paper tones, a display name treatment and an asymmetric project grid where images lead. Typography carries the hierarchy; colour stays in a single rust accent.',
    bestFor: 'Designers, writers and product people',
    categories: ['Creative'],
    accent: '#8a4b32',
    tone: 'light',
    traits: ['Asymmetric grid', 'Image-led projects', 'Display type'],
    swatches: ['#faf8f4', '#1c1a17', '#8a4b32'],
  },
  {
    id: 'student',
    name: 'Student Portfolio',
    tagline: 'Approachable, education-first and easy to scan.',
    description:
      'A soft header band, then education, skills, projects and achievements in a simple single column. Built for first portfolios, internships and campus applications.',
    bestFor: 'Students and recent graduates',
    categories: ['Student'],
    accent: '#2f6f8f',
    tone: 'light',
    traits: ['Education first', 'Single column', 'Clear sections'],
    swatches: ['#ffffff', '#eef3f6', '#2f6f8f'],
  },
  {
    id: 'freelancer',
    name: 'Modern Freelancer',
    tagline: 'Introduction, selected work and a clear way to get in touch.',
    description:
      'A split introduction with availability and contact details, selected work in a two-column grid, then capabilities and a closing contact band. Written for client-facing work.',
    bestFor: 'Freelancers and consultants',
    categories: ['Professional', 'Creative'],
    accent: '#215b7a',
    tone: 'light',
    traits: ['Split intro', 'Work grid', 'Contact band'],
    swatches: ['#ffffff', '#f4f5f3', '#215b7a'],
  },
  {
    id: 'executive',
    name: 'Executive Portfolio',
    tagline: 'Formal, structured and experience-led.',
    description:
      'A navy masthead, serif section headings and a two-column body with a fixed details rail. Experience and accomplishments are presented in a formal, document-like hierarchy.',
    bestFor: 'Managers, consultants and senior professionals',
    categories: ['Professional'],
    accent: '#8a6a3b',
    tone: 'dark',
    traits: ['Navy masthead', 'Details rail', 'Serif headings'],
    swatches: ['#16233b', '#f4f1ea', '#8a6a3b'],
  },
];

export const TEMPLATE_CATEGORIES = ['All', 'Developer', 'Professional', 'Creative', 'Student'];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((template) => [template.id, template]));

/**
 * Previous ids (and descriptive slugs) mapped onto the current six.
 * Keeping this table means old portfolios and old links still resolve.
 */
const ALIASES = {
  'minimal-professional': 'student',
  'modern-editorial': 'designer',
  'minimal': 'student',
  'editorial': 'designer',
  'obsidian': 'dark',
  'obsidian-pro': 'dark',
  'aurora': 'designer',
  'aurora-gradient': 'designer',
  'swiss': 'executive',
  'swiss-minimal': 'executive',
  'neon': 'dark',
  'neon-terminal': 'dark',
  'editorialpro': 'designer',
  'editorial-pro': 'designer',
  'executive-elite': 'executive',
  'developer-portfolio': 'developer',
  'dark-professional': 'dark',
  'creative-designer': 'designer',
  'student-portfolio': 'student',
  'modern-freelancer': 'freelancer',
  'executive-portfolio': 'executive',
};

export const DEFAULT_TEMPLATE_ID = 'developer';

/** Normalises arbitrary template identifiers into a registered canonical ID. */
export const normalizeTemplateId = (id) => {
  if (!id || typeof id !== 'string') return DEFAULT_TEMPLATE_ID;
  const clean = id.trim().toLowerCase();
  const mapped = ALIASES[clean] || clean;
  return TEMPLATE_MAP[mapped] ? mapped : DEFAULT_TEMPLATE_ID;
};

export const getTemplate = (id) => TEMPLATE_MAP[normalizeTemplateId(id)] || TEMPLATES[0];

/** Muted accents only — no neons, so portfolio colours stay believable. */
export const ACCENT_SWATCHES = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#2f5fa8', label: 'Steel blue' },
  { value: '#2f6f8f', label: 'Teal' },
  { value: '#2f7d5f', label: 'Green' },
  { value: '#8a6a3b', label: 'Ochre' },
  { value: '#8a4b32', label: 'Rust' },
  { value: '#7c3f56', label: 'Wine' },
  { value: '#4b5563', label: 'Slate' },
  { value: '#1a1d21', label: 'Ink' },
  { value: '#6d5bd0', label: 'Muted violet' },
];

export const FONTS = [
  { id: 'sans', label: 'Sans — Inter / system', stack: 'var(--font-sans)' },
  { id: 'serif', label: 'Serif — Georgia / Palatino', stack: 'var(--font-serif)' },
  { id: 'mono', label: 'Mono — JetBrains Mono', stack: 'var(--font-mono)' },
];

export const fontStack = (id) => FONTS.find((font) => font.id === id)?.stack || 'var(--font-sans)';

/** Default theme values for a template, used when switching designs. */
export const templateTheme = (id) => {
  const template = getTemplate(id);
  const fontByTemplate = { developer: 'sans', dark: 'sans', designer: 'serif', student: 'sans', freelancer: 'sans', executive: 'serif' };
  return { accent: template.accent, font: fontByTemplate[template.id] || 'sans' };
};
