import { LEGACY_TEMPLATES, LEGACY_TEMPLATE_FONTS } from './legacyTemplates.js';
import { TEMPLATE_STYLES, getStyle } from './templateStyles.js';

/**
 * PORTIAI TEMPLATE CATALOGUE
 * ==========================================================================
 * The public gallery reads this file. Nothing here is generated at runtime:
 * every entry below is a registered template with a stable id.
 *
 * A premium template is a real layout (structure) rendered with a real style
 * (palette, type, radii, effects). Both are implemented in
 * `src/templates/premium/`, so a card preview is the same React component that
 * renders a published portfolio — not a flat image and not a recoloured clone.
 *
 * 10 layouts × 10 styles = 100 premium entries, each pair used once, plus the
 * six free templates that shipped with earlier releases (106 total).
 *
 * Ids are permanent: portfolios store them, so treat them as data, not copy.
 */

export const TEMPLATE_LAYOUTS = [
  { id: 'stack', label: 'Stack', blurb: 'A single editorial column with numbered project rows.' },
  { id: 'split', label: 'Split', blurb: 'A sticky profile rail beside scrolling content.' },
  { id: 'bento', label: 'Bento', blurb: 'A modular tile grid for skills, work and contact.' },
  { id: 'gallery', label: 'Gallery', blurb: 'Project-first cards with large visual panels.' },
  { id: 'poster', label: 'Poster', blurb: 'A full-bleed display headline above a two-column body.' },
  { id: 'terminal', label: 'Terminal', blurb: 'A monospaced console layout built from prompts.' },
  { id: 'magazine', label: 'Magazine', blurb: 'A printed spread with columns and a contents index.' },
  { id: 'timeline', label: 'Timeline', blurb: 'A career rail carrying experience and education.' },
  { id: 'showcase', label: 'Showcase', blurb: 'One hero case study leading into a work reel.' },
  { id: 'mosaic', label: 'Mosaic', blurb: 'Alternating full-width and split section stripes.' },
];

export const LAYOUT_MAP = Object.fromEntries(TEMPLATE_LAYOUTS.map((layout) => [layout.id, layout]));

export const TEMPLATE_CATEGORIES_LIST = [
  'Full-Stack Developer',
  'Frontend Developer',
  'React Developer',
  'Software Engineer',
  'UI/UX Designer',
  'Freelancer',
  'Student and Fresher',
  'Creative Portfolio',
  'Photographer',
  'Agency Portfolio',
  'Minimal Portfolio',
  'Animated Portfolio',
  'Dark Portfolio',
  'Modern Premium Portfolio',
];

const CATEGORY_KEYWORDS = {
  'Full-Stack Developer': ['full stack', 'backend', 'api', 'database', 'node'],
  'Frontend Developer': ['frontend', 'javascript', 'css', 'accessibility'],
  'React Developer': ['react', 'components', 'hooks', 'vite'],
  'Software Engineer': ['engineering', 'systems', 'architecture', 'typescript'],
  'UI/UX Designer': ['design', 'figma', 'product design', 'research'],
  Freelancer: ['client work', 'consulting', 'services', 'booking'],
  'Student and Fresher': ['student', 'fresher', 'internship', 'graduate'],
  'Creative Portfolio': ['creative', 'art direction', 'visual', 'experimental'],
  Photographer: ['photography', 'photo', 'visual stories', 'lens'],
  'Agency Portfolio': ['agency', 'studio', 'team', 'case studies'],
  'Minimal Portfolio': ['minimal', 'quiet', 'clean', 'editorial'],
  'Animated Portfolio': ['motion', 'animation', 'interactive', 'kinetic'],
  'Dark Portfolio': ['dark mode', 'night', 'low light'],
  'Modern Premium Portfolio': ['premium', 'flagship', 'signature'],
};

/** A count of how many templates sit in each category, used by the filters. */
const categoryCount = (list, category) => list.filter((item) => item.categories.includes(category)).length;

/**
 * @typedef {[string, string, string, string, string, string, 0|1, string]}
 * Row tuple: id, name, category, layout, style, accent, featured, description.
 */
const PREMIUM_ROWS = [
  // ---------------------------------------------------------------- Stack
  ['stack-slate', 'Slate Stack', 'Software Engineer', 'stack', 'paper', '#2563eb', 1, 'A quiet single column with numbered project rows, hairline rules and stack tags under each entry.'],
  ['stack-midnight-ledger', 'Midnight Ledger', 'Full-Stack Developer', 'stack', 'noir', '#8ab4f8', 1, 'Dark engineering ledger: wide rules, monospaced metadata and project rows that read like release notes.'],
  ['stack-frosted-column', 'Frosted Column', 'UI/UX Designer', 'stack', 'glass', '#6366f1', 0, 'Frosted cards stacked over a pastel mesh, with soft labels and generous line height.'],
  ['stack-obsidian-column', 'Obsidian Column', 'Software Engineer', 'stack', 'obsidian', '#a78bfa', 1, 'A violet-lit glass column with translucent project panels and a glowing contact strip.'],
  ['stack-soft-pressure', 'Soft Pressure', 'Student and Fresher', 'stack', 'neumorph', '#0f766e', 0, 'Soft extruded panels pressed into a cool grey page — friendly first-portfolio energy.'],
  ['stack-concrete-cv', 'Concrete CV', 'Freelancer', 'stack', 'brutal', '#facc15', 1, 'Hard black borders, flat yellow highlights and an unapologetic one-column résumé.'],
  ['stack-widescreen-story', 'Widescreen Story', 'Creative Portfolio', 'stack', 'cinematic', '#e8c489', 0, 'A widescreen dark layout with warm highlights and slow, wide-tracked section labels.'],
  ['stack-press-column', 'Press Column', 'UI/UX Designer', 'stack', 'editorial', '#8a4b32', 0, 'Warm paper, serif headings and printed rules for a considered, editorial read.'],
  ['stack-signal-stack', 'Signal Stack', 'React Developer', 'stack', 'neon', '#7c9dff', 1, 'Deep space background with luminous edges, component tags and a glowing hero.'],
  ['stack-blackline-cv', 'Blackline CV', 'Frontend Developer', 'stack', 'monochrome', '#e11d48', 0, 'Oversized black type, one red accent and a single hard-ruled column.'],

  // ---------------------------------------------------------------- Split
  ['split-studio-rail', 'Studio Split', 'UI/UX Designer', 'split', 'paper', '#0f766e', 1, 'A restrained sticky profile rail on the left; selected work, process and contact scroll beside it.'],
  ['split-night-rail', 'Night Rail', 'Full-Stack Developer', 'split', 'noir', '#67e8f9', 0, 'Charcoal page, cyan metadata and a rail that keeps your availability visible while readers scroll.'],
  ['split-aurora-split', 'Aurora Split', 'Creative Portfolio', 'split', 'glass', '#db2777', 1, 'Pink-violet aurora behind frosted panels; the profile card stays pinned as work scrolls.'],
  ['split-violet-rail', 'Violet Rail', 'Software Engineer', 'split', 'obsidian', '#c4b5fd', 0, 'A smoked-glass sidebar over a violet glow, with translucent project cards and quiet dividers.'],
  ['split-pillow-split', 'Pillow Split', 'Student and Fresher', 'split', 'neumorph', '#2563eb', 0, 'Soft raised sidebar and pressable chips — approachable for first internships and campus applications.'],
  ['split-hard-split', 'Hard Split', 'Agency Portfolio', 'split', 'brutal', '#f97316', 1, 'Half orange block, half paper: agency capabilities with thick outlines and offset shadows.'],
  ['split-directors-cut', "Director's Cut", 'Photographer', 'split', 'cinematic', '#d4a373', 1, 'Letterboxed dark layout with warm amber labels, built around a portrait and three story panels.'],
  ['split-column-margin', 'Column & Margin', 'Frontend Developer', 'split', 'editorial', '#7c2d12', 0, 'A printed page split into a marginalia rail and a serif column of project notes.'],
  ['split-circuit-split', 'Circuit Split', 'React Developer', 'split', 'neon', '#38bdf8', 0, 'Electric blue rails, dark glass panels and component chips arranged along a fixed sidebar.'],
  ['split-stark-profile', 'Stark Profile', 'Freelancer', 'split', 'monochrome', '#2563eb', 0, 'Black-and-white split with oversized name type and one blue button that closes the page.'],

  // ---------------------------------------------------------------- Bento
  ['bento-grid-ledger', 'Grid Ledger', 'Full-Stack Developer', 'bento', 'paper', '#1d4ed8', 1, 'A tidy bento of about, stack, projects and contact tiles with equal visual weight.'],
  ['bento-night-grid', 'Night Grid', 'Software Engineer', 'bento', 'noir', '#f9a8d4', 0, 'Dark modular tiles with pink accents and a wide project tile anchoring the grid.'],
  ['bento-bubble-blocks', 'Bubble Blocks', 'UI/UX Designer', 'bento', 'glass', '#7c3aed', 1, 'Frosted bento blocks over a colour mesh, with blurred edges and rounded corners.'],
  ['bento-orbit-tiles', 'Orbit Tiles', 'React Developer', 'bento', 'obsidian', '#818cf8', 0, 'Smoked glass tiles orbiting a highlighted project card, all on a near-black violet base.'],
  ['bento-soft-tiles', 'Soft Tiles', 'Student and Fresher', 'bento', 'neumorph', '#0369a1', 0, 'Pillow-soft tiles that hold education, skills and first projects without visual noise.'],
  ['bento-block-party', 'Block Party', 'Creative Portfolio', 'bento', 'brutal', '#22c55e', 1, 'Colour-block bento with black outlines, green highlights and hard offset shadows.'],
  ['bento-reel-grid', 'Reel Grid', 'Photographer', 'bento', 'cinematic', '#eab308', 0, 'Cinema-dark tiles with amber frames, sized for portrait and landscape photographs.'],
  ['bento-paper-grid', 'Paper Grid', 'Agency Portfolio', 'bento', 'editorial', '#166534', 0, 'A printed editorial grid: serif captions, thin rules and numbered capability tiles.'],
  ['bento-hologram-grid', 'Hologram Grid', 'Animated Portfolio', 'bento', 'neon', '#a78bfa', 1, 'Iridescent tiles on midnight blue with gradient borders that catch the light on hover.'],
  ['bento-mono-tiles', 'Mono Tiles', 'Frontend Developer', 'bento', 'monochrome', '#0284c7', 0, 'Black-and-white tiles with a single sky-blue accent tile for contact.'],

  // ---------------------------------------------------------------- Gallery
  ['gallery-portfolio-wall', 'Portfolio Wall', 'Frontend Developer', 'gallery', 'paper', '#0f766e', 1, 'A project wall: large bordered previews, short captions and technology notes underneath.'],
  ['gallery-black-gallery', 'Black Gallery', 'Photographer', 'gallery', 'noir', '#e5e5e5', 1, 'A dark gallery with wide image panels, off-white captions and almost no chrome.'],
  ['gallery-prism-wall', 'Prism Wall', 'Creative Portfolio', 'gallery', 'glass', '#8b5cf6', 0, 'Frosted gallery cards over a prismatic gradient, colour spilling between the panels.'],
  ['gallery-night-gallery', 'Night Gallery', 'Photographer', 'gallery', 'obsidian', '#f0abfc', 0, 'Deep violet glass frames for photographs, with a soft pink accent on links.'],
  ['gallery-soft-gallery', 'Soft Gallery', 'UI/UX Designer', 'gallery', 'neumorph', '#7c3aed', 0, 'Raised gallery tiles on soft grey, each project presented as a pressable surface.'],
  ['gallery-poster-wall', 'Poster Wall', 'Creative Portfolio', 'gallery', 'brutal', '#ef4444', 1, 'Three huge poster panels with black rules and red captions — work first, words second.'],
  ['gallery-frame-wall', 'Frame Wall', 'Photographer', 'gallery', 'cinematic', '#e0b080', 1, 'A dark contact sheet with warm frames, film labels and a widescreen hero image.'],
  ['gallery-contact-sheet', 'Contact Sheet', 'Agency Portfolio', 'gallery', 'editorial', '#b45309', 0, 'An agency contact sheet on warm paper: serif titles, numbered projects, tight captions.'],
  ['gallery-neon-frames', 'Neon Frames', 'Animated Portfolio', 'gallery', 'neon', '#22d3ee', 0, 'Cyan-lit frames on a midnight background, built to make motion work feel like a screening.'],
  ['gallery-white-wall', 'White Wall', 'Minimal Portfolio', 'gallery', 'monochrome', '#e11d48', 0, 'A white room for your work: hairline frames, big type and a single red rule.'],

  // ---------------------------------------------------------------- Poster
  ['poster-broadside', 'Broadside', 'Agency Portfolio', 'poster', 'paper', '#1e3a8a', 1, 'A broadside masthead with an oversized agency name, then services and client work in two columns.'],
  ['poster-black-poster', 'Black Poster', 'Minimal Portfolio', 'poster', 'noir', '#f5f5f4', 0, 'One enormous off-white headline on black, followed by a restrained list of work.'],
  ['poster-glow-poster', 'Glow Poster', 'Creative Portfolio', 'poster', 'glass', '#6366f1', 1, 'A poster-scale frosted hero floating over colour, with translucent cards below.'],
  ['poster-deep-poster', 'Deep Poster', 'Animated Portfolio', 'poster', 'obsidian', '#a78bfa', 0, 'Violet glass poster treatment with a glowing headline and floating project cards.'],
  ['poster-soft-poster', 'Soft Poster', 'Student and Fresher', 'poster', 'neumorph', '#1d4ed8', 0, 'An oversized soft-type headline on a padded grey page, easy on first-time portfolios.'],
  ['poster-loud-poster', 'Loud Poster', 'Creative Portfolio', 'poster', 'brutal', '#facc15', 1, 'Yellow slab headline, black outline type and a poster wall of projects.'],
  ['poster-title-card', 'Title Card', 'Photographer', 'poster', 'cinematic', '#e8c489', 0, 'A film title card hero with warm tracking, then a letterboxed portfolio of images.'],
  ['poster-masthead', 'Masthead', 'Agency Portfolio', 'poster', 'editorial', '#9f1239', 0, 'Newspaper masthead with serif display type, dateline details and columned case studies.'],
  ['poster-afterglow', 'Afterglow', 'Animated Portfolio', 'poster', 'neon', '#818cf8', 1, 'A glowing gradient headline over midnight blue, with luminous cards for motion work.'],
  ['poster-headline', 'Headline', 'UI/UX Designer', 'poster', 'monochrome', '#2563eb', 0, 'A single black headline at poster scale with one blue accent and a disciplined grid.'],

  // ---------------------------------------------------------------- Terminal
  ['terminal-paper-shell', 'Paper Shell', 'Frontend Developer', 'terminal', 'paper', '#0f766e', 0, 'A monospaced paper console: prompt lines, an inline stack array and project output blocks.'],
  ['terminal-night-shell', 'Night Shell', 'Software Engineer', 'terminal', 'noir', '#4ade80', 1, 'A dark terminal with green prompts, JSON project records and a monospaced résumé.'],
  ['terminal-glass-shell', 'Glass Shell', 'React Developer', 'terminal', 'glass', '#0284c7', 0, 'A frosted console over pastel colour, with mono metadata inside glass output panels.'],
  ['terminal-kernel', 'Kernel', 'Software Engineer', 'terminal', 'obsidian', '#34d399', 0, 'A violet-black shell with emerald output, built for systems and backend engineers.'],
  ['terminal-soft-shell', 'Soft Shell', 'Student and Fresher', 'terminal', 'neumorph', '#065f46', 0, 'A soft console where each prompt line is a raised panel — friendly for learning-in-public.'],
  ['terminal-hard-shell', 'Hard Shell', 'Full-Stack Developer', 'terminal', 'brutal', '#22c55e', 0, 'Harsh black borders and green prompts on cream — a console with nothing to hide.'],
  ['terminal-dark-command', 'Dark Command', 'Full-Stack Developer', 'terminal', 'cinematic', '#e8c489', 1, 'A cinematic command line: warm amber prompts, letterboxed sections and quiet credits.'],
  ['terminal-typewritten', 'Typewritten', 'Freelancer', 'terminal', 'editorial', '#78350f', 0, 'A typewritten proposal page — monospaced on paper, with serif client names.'],
  ['terminal-neon-terminal', 'Neon Terminal', 'React Developer', 'terminal', 'neon', '#4ade80', 1, 'An electric console with glowing green output and component tags as command flags.'],
  ['terminal-mono-shell', 'Mono Shell', 'Software Engineer', 'terminal', 'monochrome', '#16a34a', 0, 'Pure black-and-white console with a single green prompt and oversized command type.'],

  // ---------------------------------------------------------------- Magazine
  ['magazine-field-notes', 'Field Notes', 'Creative Portfolio', 'magazine', 'paper', '#b45309', 0, 'A field-notes spread with a contents index, drop caps and small captioned project entries.'],
  ['magazine-night-edition', 'Night Edition', 'Agency Portfolio', 'magazine', 'noir', '#fcd34d', 0, 'A nocturnal magazine with amber folios, dark columns and a contents page.'],
  ['magazine-lucent-issue', 'Lucent Issue', 'UI/UX Designer', 'magazine', 'glass', '#a855f7', 1, 'A frosted magazine layout over colour, with soft folios and translucent pull quotes.'],
  ['magazine-violet-issue', 'Violet Issue', 'Creative Portfolio', 'magazine', 'obsidian', '#f0abfc', 0, 'A violet magazine on smoked glass, mixing pink pull quotes and dark editorial columns.'],
  ['magazine-soft-issue', 'Soft Issue', 'Student and Fresher', 'magazine', 'neumorph', '#1d4ed8', 0, 'A gentle student magazine where each section is a soft card with a numbered folio.'],
  ['magazine-zine', 'Zine', 'Creative Portfolio', 'magazine', 'brutal', '#f43f5e', 1, 'A photocopied zine: bold outlines, rotated accents and a contents list that refuses to behave.'],
  ['magazine-cinema-issue', 'Cinema Issue', 'Photographer', 'magazine', 'cinematic', '#e8c489', 1, 'A film-magazine spread with warm serif captions, letterboxed frames and a credits column.'],
  ['magazine-broadsheet', 'Broadsheet', 'Agency Portfolio', 'magazine', 'editorial', '#92400e', 0, 'A broadsheet with a proper masthead, drop cap and three-column agency case studies.'],
  ['magazine-neon-issue', 'Neon Issue', 'Animated Portfolio', 'magazine', 'neon', '#c084fc', 0, 'A luminous magazine spread with gradient folios and motion-work pull quotes.'],
  ['magazine-mono-issue', 'Mono Issue', 'Minimal Portfolio', 'magazine', 'monochrome', '#111111', 0, 'An austere black-and-white magazine — one typeface, one rule weight, no decoration.'],

  // ---------------------------------------------------------------- Timeline
  ['timeline-career-line', 'Career Line', 'Software Engineer', 'timeline', 'paper', '#2563eb', 1, 'A career rail with dated roles, education and project milestones in a quiet single column.'],
  ['timeline-night-line', 'Night Line', 'Full-Stack Developer', 'timeline', 'noir', '#7dd3fc', 0, 'A dark career timeline with sky-blue markers and dated project releases.'],
  ['timeline-flow-line', 'Flow Line', 'UI/UX Designer', 'timeline', 'glass', '#6366f1', 1, 'A frosted timeline over a soft gradient, with cards flowing past a fixed date rail.'],
  ['timeline-orbit-line', 'Orbit Line', 'Software Engineer', 'timeline', 'obsidian', '#a78bfa', 0, 'A violet glass timeline with glowing markers and project cards in orbit around it.'],
  ['timeline-soft-line', 'Soft Line', 'Student and Fresher', 'timeline', 'neumorph', '#0284c7', 0, 'Soft raised timeline nodes for education, internships and first projects.'],
  ['timeline-track-record', 'Track Record', 'Freelancer', 'timeline', 'brutal', '#facc15', 0, 'A track record with black rules, yellow date blocks and client work in hard-outlined cards.'],
  ['timeline-long-take', 'Long Take', 'Creative Portfolio', 'timeline', 'cinematic', '#e8c489', 0, 'A long-take timeline: warm markers, letterboxed frames and slow, deliberate pacing.'],
  ['timeline-chronicle', 'Chronicle', 'Agency Portfolio', 'timeline', 'editorial', '#7c2d12', 0, 'A printed chronicle of studio history, with serif dates and ruled columns.'],
  ['timeline-pulse-line', 'Pulse Line', 'Frontend Developer', 'timeline', 'neon', '#38bdf8', 0, 'A glowing timeline with cyan pulses for releases and interfaces shipped.'],
  ['timeline-plain-line', 'Plain Line', 'Student and Fresher', 'timeline', 'monochrome', '#0f766e', 0, 'A plain black rule with dates and roles — everything a first portfolio needs, nothing more.'],

  // ---------------------------------------------------------------- Showcase
  ['showcase-case-study', 'Case Study', 'UI/UX Designer', 'showcase', 'paper', '#0f172a', 1, 'One featured case study at hero scale, then supporting work, process and a contact band.'],
  ['showcase-spotlight', 'Spotlight', 'Creative Portfolio', 'showcase', 'noir', '#fbbf24', 1, 'A spotlight hero on black with an amber rim of light around your latest work.'],
  ['showcase-hero-glass', 'Hero Glass', 'Freelancer', 'showcase', 'glass', '#6d28d9', 0, 'Frosted hero panel over colour, with services and availability clearly labelled.'],
  ['showcase-star-showcase', 'Star Showcase', 'Animated Portfolio', 'showcase', 'obsidian', '#818cf8', 0, 'A star-lit glass showcase where the hero project glows violet against near-black.'],
  ['showcase-soft-showcase', 'Soft Showcase', 'Student and Fresher', 'showcase', 'neumorph', '#1d4ed8', 0, 'A soft showcase with one raised hero card and gentle supporting project tiles.'],
  ['showcase-loud-showcase', 'Loud Showcase', 'Agency Portfolio', 'showcase', 'brutal', '#fb7185', 1, 'A loud agency showcase with oversized type, black outlines and a pink hero block.'],
  ['showcase-premiere', 'Premiere', 'Photographer', 'showcase', 'cinematic', '#e8c489', 1, 'A premiere: one wide hero image, warm title treatment and a supporting contact sheet.'],
  ['showcase-feature-story', 'Feature Story', 'Creative Portfolio', 'showcase', 'editorial', '#7c2d12', 0, 'A feature-story layout with a long-form hero, pull quote and numbered supporting work.'],
  ['showcase-halo', 'Halo', 'Full-Stack Developer', 'showcase', 'neon', '#60a5fa', 0, 'A blue halo hero over midnight, with product screens described as case studies.'],
  ['showcase-spotlight-mono', 'Spotlight Mono', 'Minimal Portfolio', 'showcase', 'monochrome', '#e11d48', 0, 'A single spotlight hero in black and white, with one red rule to mark the work.'],

  // ---------------------------------------------------------------- Mosaic
  ['mosaic-paper-mosaic', 'Mosaic Paper', 'Full-Stack Developer', 'mosaic', 'paper', '#0d9488', 0, 'Alternating full-width and split stripes for a full-stack story with room for detail.'],
  ['mosaic-night-mosaic', 'Night Mosaic', 'Creative Portfolio', 'mosaic', 'noir', '#f0abfc', 0, 'A dark mosaic with pink accents and alternating full-bleed project stripes.'],
  ['mosaic-kaleido', 'Kaleido', 'UI/UX Designer', 'mosaic', 'glass', '#0284c7', 1, 'Colour panels slide between frosted sections in this kaleidoscopic designer layout.'],
  ['mosaic-shard', 'Shard', 'Animated Portfolio', 'mosaic', 'obsidian', '#c4b5fd', 0, 'Violet glass shards alternate with dark full-width motion sections.'],
  ['mosaic-soft-mosaic', 'Soft Mosaic', 'Student and Fresher', 'mosaic', 'neumorph', '#2563eb', 0, 'Soft alternating stripes that give a student portfolio rhythm without visual noise.'],
  ['mosaic-cut-paste', 'Cut & Paste', 'Creative Portfolio', 'mosaic', 'brutal', '#f97316', 1, 'A cut-and-paste zine mosaic: orange blocks, black rules and deliberately off-grid captions.'],
  ['mosaic-film-mosaic', 'Film Mosaic', 'Photographer', 'mosaic', 'cinematic', '#e8c489', 0, 'Letterboxed photo stripes alternate with warm credits in this cinematic mosaic.'],
  ['mosaic-salon-wall', 'Salon Wall', 'Agency Portfolio', 'mosaic', 'editorial', '#166534', 0, 'A salon wall on warm paper: mixed-size plates, serif captions and printed rules.'],
  ['mosaic-pixel-glow', 'Pixel Glow', 'React Developer', 'mosaic', 'neon', '#22d3ee', 0, 'A glowing pixel mosaic with cyan interface chips and alternating motion sections.'],
  ['mosaic-black-mosaic', 'Black Mosaic', 'Minimal Portfolio', 'mosaic', 'monochrome', '#2563eb', 0, 'A strict black-and-white mosaic with one blue block to carry the eye.'],
];

const CATALOGUE_EPOCH = Date.UTC(2026, 9, 20, 9, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

const unique = (values) => [...new Set(values.filter(Boolean))];
const slugToWords = (value) => value.replace(/-/g, ' ');

const buildPremiumEntry = (row, index) => {
  const [id, name, category, layout, styleId, accent, featured, description] = row;
  const layoutMeta = LAYOUT_MAP[layout];
  const style = getStyle(styleId);

  const categories = unique([
    category,
    style.appearance === 'dark' ? 'Dark Portfolio' : null,
    featured ? 'Modern Premium Portfolio' : null,
  ]);

  const tags = unique([
    category.toLowerCase(),
    style.label.toLowerCase(),
    layoutMeta?.label.toLowerCase(),
    `${style.appearance} appearance`,
    ...(CATEGORY_KEYWORDS[category] || []),
    slugToWords(id),
  ]);

  return {
    id,
    name,
    category,
    categories,
    tags,
    description,
    tagline: `${layoutMeta?.label} layout in a ${style.label.toLowerCase()} style.`,
    bestFor: category,
    accent,
    tone: style.appearance,
    appearance: style.appearance,
    layout,
    layoutLabel: layoutMeta?.label || layout,
    style: styleId,
    styleLabel: style.label,
    tier: 'premium',
    tierLabel: 'Premium',
    featured: Boolean(featured),
    legacy: false,
    font: style.tokens.font.includes('serif') ? 'serif' : style.tokens.font.includes('mono') ? 'mono' : 'sans',
    swatches: [style.preview[0], style.preview[1], accent],
    addedAt: new Date(CATALOGUE_EPOCH - index * 41 * 60 * 60 * 1000).toISOString(),
  };
};

/**
 * The six originals predate the category taxonomy. They keep their original
 * category list (still used by legacy filters) and gain a primary catalogue
 * category so they appear under the same filters as everything else.
 */
const LEGACY_PRIMARY_CATEGORY = {
  developer: 'Frontend Developer',
  dark: 'Software Engineer',
  designer: 'UI/UX Designer',
  student: 'Student and Fresher',
  freelancer: 'Freelancer',
  executive: 'Modern Premium Portfolio',
};

const buildLegacyEntry = (template, index) => ({
  ...template,
  category: LEGACY_PRIMARY_CATEGORY[template.id] || 'Creative Portfolio',
  categories: unique([LEGACY_PRIMARY_CATEGORY[template.id], ...template.categories, template.tone === 'dark' ? 'Dark Portfolio' : null]),
  appearance: template.tone,
  layout: 'legacy',
  layoutLabel: 'Original',
  style: template.tone === 'dark' ? 'noir' : 'paper',
  styleLabel: template.tone === 'dark' ? 'Classic dark' : 'Classic light',
  tier: 'free',
  tierLabel: 'Free',
  featured: index < 3,
  legacy: true,
  font: LEGACY_TEMPLATE_FONTS[template.id] || 'sans',
  tags: unique([
    ...template.categories.map((item) => item.toLowerCase()),
    ...template.traits.map((item) => item.toLowerCase()),
    template.bestFor.toLowerCase(),
    template.tone === 'dark' ? 'dark portfolio' : 'light portfolio',
    'original',
    'free',
    slugToWords(template.id),
  ]),
  addedAt: new Date(Date.UTC(2026, 0, 12 + index * 3, 9, 0, 0)).toISOString(),
});

const PREMIUM_TEMPLATES = PREMIUM_ROWS.map(buildPremiumEntry);
const LEGACY_CATALOGUE = LEGACY_TEMPLATES.map(buildLegacyEntry);

/**
 * Every registered template: 100 premium entries followed by the six free
 * originals. Free templates come first in the gallery's default "featured"
 * sort so new visitors can use something immediately.
 */
export const TEMPLATE_CATALOGUE = [...LEGACY_CATALOGUE, ...PREMIUM_TEMPLATES];

export const TEMPLATE_COUNT = TEMPLATE_CATALOGUE.length;
export const PREMIUM_TEMPLATE_COUNT = PREMIUM_TEMPLATES.length;
export const FREE_TEMPLATE_COUNT = LEGACY_CATALOGUE.length;

/** Stable id → template lookup used by the renderer, editor and API sync. */
export const CATALOGUE_MAP = Object.fromEntries(TEMPLATE_CATALOGUE.map((template) => [template.id, template]));

export const getCatalogueTemplate = (id) => (typeof id === 'string' ? CATALOGUE_MAP[id.trim().toLowerCase()] : undefined);

export const isPremiumTemplateId = (id) => Boolean(getCatalogueTemplate(id)?.tier === 'premium');

/** Category list with counts, for the filter rail and the landing page. */
export const CATEGORY_FACETS = TEMPLATE_CATEGORIES_LIST.map((category) => ({
  id: category,
  label: category,
  count: categoryCount(TEMPLATE_CATALOGUE, category),
}));

export const STYLE_FACETS = TEMPLATE_STYLES.map((style) => ({
  id: style.id,
  label: style.label,
  appearance: style.appearance,
  count: TEMPLATE_CATALOGUE.filter((template) => template.style === style.id).length,
}));

/** Data consumed by the server so it can validate and gate template ids. */
export const TEMPLATE_ID_MANIFEST = TEMPLATE_CATALOGUE.map((template) => ({
  id: template.id,
  name: template.name,
  tier: template.tier,
  accent: template.accent,
  font: template.font,
  layout: template.layout,
  style: template.style,
}));
