/**
 * Template registry shared by the gallery, the editor and the renderer.
 *
 * `TEMPLATES` remains the six original free layouts (their ids must match
 * server/src/utils/portfolioDefaults.js). `getTemplate` and
 * `normalizeTemplateId` also understand every id in the premium catalogue, so
 * designs selected from the gallery keep working through the editor, the
 * preview and the public page.
 *
 * Earlier releases shipped different ids; those are mapped by ALIASES so
 * existing portfolios keep rendering after the rename.
 */
import { LEGACY_TEMPLATES, LEGACY_TEMPLATE_FONTS } from '../data/legacyTemplates.js';
import { getCatalogueTemplate } from '../data/templateCatalogue.js';

export const TEMPLATES = LEGACY_TEMPLATES;

export const TEMPLATE_CATEGORIES = ['All', 'Developer', 'Professional', 'Creative', 'Student'];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((template) => [template.id, template]));

/**
 * Previous ids (and descriptive slugs) mapped onto the current six.
 * Keeping this table means old portfolios and old links still resolve.
 */
const ALIASES = {
  'minimal-professional': 'student',
  'modern-editorial': 'designer',
  minimal: 'student',
  editorial: 'designer',
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

export const DEFAULT_TEMPLATE_ID = 'developer';

/**
 * Normalises arbitrary template identifiers into a registered canonical ID.
 * Catalogue ids (including premium ones) are preserved; legacy aliases resolve
 * to their modern equivalent; anything unknown falls back to the default.
 */
export const normalizeTemplateId = (id) => {
  if (!id || typeof id !== 'string') return DEFAULT_TEMPLATE_ID;
  const clean = id.trim().toLowerCase();
  const mapped = ALIASES[clean] || clean;
  if (TEMPLATE_MAP[mapped]) return mapped;
  if (getCatalogueTemplate(mapped)) return mapped;
  return DEFAULT_TEMPLATE_ID;
};

/** Returns the full catalogue entry when available, otherwise the legacy entry. */
export const getTemplate = (id) => {
  const canonical = normalizeTemplateId(id);
  return getCatalogueTemplate(canonical) || TEMPLATE_MAP[canonical] || TEMPLATES[0];
};

/** True only for the six original, always-free layouts. */
export const isLegacyTemplateId = (id) => Boolean(TEMPLATE_MAP[normalizeTemplateId(id)]);

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
  const font = template.tier === 'premium' ? template.font : LEGACY_TEMPLATE_FONTS[template.id] || 'sans';
  return { accent: template.accent, font };
};
