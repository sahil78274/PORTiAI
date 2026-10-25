export const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Professional',
    tagline: 'Quiet, typographic and recruiter-friendly.',
    description:
      'A single-column layout with generous margins, small-caps section labels and thin rules. Built for students and job seekers who want the content to carry the page.',
    bestFor: 'Students, freshers, academic applications',
    accent: '#2f4a8b',
    traits: ['Single column', 'Serif headings', 'Print-friendly'],
  },
  {
    id: 'developer',
    name: 'Developer Portfolio',
    tagline: 'Technical proof, front and centre.',
    description:
      'A two-column layout with a sticky profile rail, monospace labels, repository links on every project and a skills grid that reads like a stack list.',
    bestFor: 'Developers, engineers, technical interns',
    accent: '#1f5c4a',
    traits: ['Sticky rail', 'Monospace labels', 'Project links'],
  },
  {
    id: 'editorial',
    name: 'Modern Editorial',
    tagline: 'Magazine structure with clear hierarchy.',
    description:
      'An asymmetric grid, a large display name line and numbered section headings. Suits design, writing and product profiles that need a distinctive rhythm.',
    bestFor: 'Designers, writers, product roles',
    accent: '#8a3a2f',
    traits: ['Asymmetric grid', 'Display type', 'Numbered sections'],
  },
];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((template) => [template.id, template]));

export const getTemplate = (id) => TEMPLATE_MAP[id] || TEMPLATES[0];

export const ACCENT_SWATCHES = [
  { value: '#2f4a8b', label: 'Muted indigo' },
  { value: '#1f5c4a', label: 'Deep green' },
  { value: '#8a3a2f', label: 'Brick' },
  { value: '#2b2b2b', label: 'Charcoal' },
  { value: '#4a3c78', label: 'Plum' },
  { value: '#1f5568', label: 'Slate teal' },
];

export const FONTS = [
  { id: 'sans', label: 'Sans (Inter / system)', stack: 'var(--font-sans)' },
  { id: 'serif', label: 'Serif (Georgia / Palatino)', stack: 'var(--font-serif)' },
  { id: 'mono', label: 'Monospace (SF Mono / Consolas)', stack: 'var(--font-mono)' },
];

export const fontStack = (id) => FONTS.find((font) => font.id === id)?.stack || 'var(--font-sans)';
