/**
 * Template registry shared by the gallery, the editor and the renderer.
 * The ids must match server/src/utils/portfolioDefaults.js TEMPLATE_IDS.
 */
export const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Professional',
    tagline: 'Quiet, typographic and recruiter-friendly.',
    description:
      'A single-column layout with generous margins, small-caps section labels and thin rules. Built for people who want the content — not the chrome — to carry the page.',
    bestFor: 'Students, freshers, academic applications',
    categories: ['Minimal', 'Professional'],
    accent: '#2f4a8b',
    tone: 'light',
    traits: ['Single column', 'Serif headings', 'Print-friendly'],
    swatches: ['#2f4a8b', '#f4f4f5', '#ffffff'],
  },
  {
    id: 'developer',
    name: 'Developer Portfolio',
    tagline: 'Technical proof, front and centre.',
    description:
      'A sticky profile rail with monospace labels, a stack grid and repository links on every project. Reads like an engineer wrote it.',
    bestFor: 'Full-stack engineers, technical interns',
    categories: ['Developer'],
    accent: '#1f5c4a',
    tone: 'light',
    traits: ['Sticky rail', 'Monospace labels', 'Project links'],
    swatches: ['#101a17', '#1f5c4a', '#cfe0d7'],
  },
  {
    id: 'editorial',
    name: 'Modern Editorial',
    tagline: 'Magazine structure with clear hierarchy.',
    description:
      'An asymmetric grid, a large display name line and numbered section headings. Suits design, writing and product profiles that need a distinctive rhythm.',
    bestFor: 'Designers, writers, product roles',
    categories: ['Creative', 'Minimal'],
    accent: '#8a3a2f',
    tone: 'light',
    traits: ['Asymmetric grid', 'Display type', 'Numbered sections'],
    swatches: ['#fdfcf9', '#8a3a2f', '#2b2b2b'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian Pro',
    tagline: 'Premium dark developer portfolio.',
    description:
      'Black and charcoal surfaces, restrained violet accents and a minimal hero built around strong typography. Engineered for technical depth without visual noise.',
    bestFor: 'Full-stack and backend developers',
    categories: ['Dark', 'Developer'],
    accent: '#8b5cf6',
    tone: 'dark',
    traits: ['Charcoal surfaces', 'Violet accents', 'Minimal hero'],
    swatches: ['#08080b', '#17171c', '#8b5cf6'],
  },
  {
    id: 'aurora',
    name: 'Aurora Gradient',
    tagline: 'Blue-violet gradients and layered light.',
    description:
      'A rich gradient canvas with layered glass cards, soft bloom and elegant motion-inspired accents. Made for AI engineers and creative developers.',
    bestFor: 'AI engineers and creative developers',
    categories: ['Creative', 'Dark', 'Developer'],
    accent: '#6366f1',
    tone: 'dark',
    traits: ['Gradient canvas', 'Glass cards', 'Layered light'],
    swatches: ['#0b1026', '#6366f1', '#a855f7'],
  },
  {
    id: 'swiss',
    name: 'Swiss Minimal',
    tagline: 'Editorial whitespace, structured grid.',
    description:
      'A white canvas, black typography and a strict twelve-column grid. Content is ordered like a printed typographic specimen rather than a website.',
    bestFor: 'Designers, students, professional résumés',
    categories: ['Minimal', 'Professional'],
    accent: '#111111',
    tone: 'light',
    traits: ['Swiss grid', 'Black on white', 'Editorial spacing'],
    swatches: ['#ffffff', '#111111', '#ef4444'],
  },
  {
    id: 'neon',
    name: 'Neon Terminal',
    tagline: 'A portfolio that boots up.',
    description:
      'Terminal-inspired chrome, monospace typography, cyan prompts and code-styled project entries. Built for programmers and security folks.',
    bestFor: 'Programmers and cybersecurity portfolios',
    categories: ['Dark', 'Developer', 'Creative'],
    accent: '#22d3ee',
    tone: 'dark',
    traits: ['Terminal chrome', 'Monospace', 'Prompt details'],
    swatches: ['#05090a', '#0c1517', '#22d3ee'],
  },
  {
    id: 'editorialpro',
    name: 'Editorial Pro',
    tagline: 'Sophisticated, image-led storytelling.',
    description:
      'Elegant display headings, balanced spacing and generous project imagery. Designed for creators whose work needs to be seen before it is read.',
    bestFor: 'Content creators and UI/UX designers',
    categories: ['Creative', 'Professional'],
    accent: '#b45309',
    tone: 'light',
    traits: ['Image-led projects', 'Elegant headings', 'Balanced spacing'],
    swatches: ['#faf7f2', '#b45309', '#1c1917'],
  },
  {
    id: 'executive',
    name: 'Executive Elite',
    tagline: 'Leadership, distilled.',
    description:
      'Deep navy with ivory and restrained gold. Strong experience, achievement and leadership sections with a formal, consulting-grade layout.',
    bestFor: 'Experienced professionals and consultants',
    categories: ['Professional', 'Dark'],
    accent: '#c8a24a',
    tone: 'dark',
    traits: ['Navy & gold', 'Leadership focus', 'Formal layout'],
    swatches: ['#0e1c33', '#f4f1e8', '#c8a24a'],
  },
];

export const TEMPLATE_CATEGORIES = ['All', 'Developer', 'Minimal', 'Creative', 'Dark', 'Professional'];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((template) => [template.id, template]));

const ALIASES = {
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

/** Normalises arbitrary template identifiers into a registered canonical ID. */
export const normalizeTemplateId = (id) => {
  if (!id || typeof id !== 'string') return 'minimal';
  const clean = id.trim().toLowerCase();
  const mapped = ALIASES[clean] || clean;
  return TEMPLATE_MAP[mapped] ? mapped : 'minimal';
};

export const getTemplate = (id) => TEMPLATE_MAP[normalizeTemplateId(id)] || TEMPLATES[0];

export const ACCENT_SWATCHES = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#3b82f6', label: 'Electric blue' },
  { value: '#a855f7', label: 'Violet' },
  { value: '#22d3ee', label: 'Cyan' },
  { value: '#34d399', label: 'Emerald' },
  { value: '#f472b6', label: 'Rose' },
  { value: '#fbbf24', label: 'Amber' },
  { value: '#2f4a8b', label: 'Muted indigo' },
  { value: '#1f5c4a', label: 'Deep green' },
  { value: '#8a3a2f', label: 'Brick' },
  { value: '#b45309', label: 'Burnt amber' },
  { value: '#111111', label: 'Ink black' },
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
  return { accent: template.accent, font: template.id === 'neon' || template.id === 'developer' ? 'mono' : 'sans' };
};
