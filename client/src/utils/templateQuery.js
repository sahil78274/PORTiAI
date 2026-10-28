/**
 * Pure search / filter / sort / pagination helpers for the template gallery.
 *
 * Keeping them free of React makes the behaviour testable (see
 * client/tests/templateCatalogue.test.js) and keeps the gallery component thin.
 * The page size is the same as the "Load more" step; if the API later exposes
 * paginated template endpoints, only the caller changes — these helpers can be
 * swapped for a query object without touching the UI.
 */
import { TEMPLATE_CATALOGUE, TEMPLATE_CATEGORIES_LIST } from '../data/templateCatalogue.js';

export const PAGE_SIZE = 12;

export const CATEGORY_OPTIONS = ['All', ...TEMPLATE_CATEGORIES_LIST];
export const STYLE_OPTIONS = ['All', ...new Set(TEMPLATE_CATALOGUE.filter((t) => t.tier === 'premium').map((t) => t.style))];
export const APPEARANCE_OPTIONS = [
  { id: 'all', label: 'Any appearance' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];
export const ACCESS_OPTIONS = [
  { id: 'all', label: 'All access' },
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium' },
];
export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'alphabetical', label: 'A–Z' },
];

export const DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  style: 'All',
  appearance: 'all',
  access: 'all',
  sort: 'featured',
};

const searchableText = (template) =>
  [
    template.name,
    template.tagline,
    template.description,
    template.category,
    template.layoutLabel,
    template.styleLabel,
    ...(template.tags || []),
    ...(template.categories || []),
  ]
    .join(' ')
    .toLowerCase();

/**
 * Applies every active filter and the sort order.
 * @param {object[]} list catalogue entries
 * @param {object} filters
 */
export const filterTemplates = (list, filters = {}) => {
  const options = { ...DEFAULT_FILTERS, ...filters };
  const term = options.search.trim().toLowerCase();

  const filtered = list.filter((template) => {
    if (options.category !== 'All' && !template.categories.includes(options.category)) return false;
    if (options.style !== 'All' && template.style !== options.style) return false;
    if (options.appearance !== 'all' && template.appearance !== options.appearance) return false;
    if (options.access === 'free' && template.tier !== 'free') return false;
    if (options.access === 'premium' && template.tier !== 'premium') return false;
    if (!term) return true;
    return term.split(/\s+/).filter(Boolean).every((word) => searchableText(template).includes(word));
  });

  return sortTemplates(filtered, options.sort);
};

export const sortTemplates = (list, sort) => {
  const copy = [...list];
  if (sort === 'newest') {
    return copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }
  if (sort === 'alphabetical') {
    return copy.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }
  // Featured: free templates first (so a new visitor can start immediately),
  // then highlighted designs, then the curated catalogue order.
  const index = new Map(TEMPLATE_CATALOGUE.map((template, position) => [template.id, position]));
  return copy.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'free' ? -1 : 1;
    if (Boolean(b.featured) !== Boolean(a.featured)) return a.featured ? -1 : 1;
    return (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
  });
};

/** Returns the first `limit` entries and the remaining count. */
export const paginateTemplates = (list, limit = PAGE_SIZE) => ({
  visible: list.slice(0, limit),
  remaining: Math.max(0, list.length - limit),
  hasMore: list.length > limit,
});

export const describeRange = (shown, total) =>
  total === 0 ? 'No templates match these filters' : `Showing ${shown} of ${total} template${total === 1 ? '' : 's'}`;

export const activeFilterCount = (filters) => {
  const options = { ...DEFAULT_FILTERS, ...filters };
  let count = 0;
  if (options.search.trim()) count += 1;
  if (options.category !== 'All') count += 1;
  if (options.style !== 'All') count += 1;
  if (options.appearance !== 'all') count += 1;
  if (options.access !== 'all') count += 1;
  return count;
};
