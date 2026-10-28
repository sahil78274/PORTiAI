import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEMPLATE_CATALOGUE,
  TEMPLATE_COUNT,
  PREMIUM_TEMPLATE_COUNT,
  FREE_TEMPLATE_COUNT,
  TEMPLATE_LAYOUTS,
  TEMPLATE_CATEGORIES_LIST,
  CATALOGUE_MAP,
  getCatalogueTemplate,
  isPremiumTemplateId,
} from '../src/data/templateCatalogue.js';
import { TEMPLATE_STYLES } from '../src/data/templateStyles.js';
import {
  PAGE_SIZE,
  DEFAULT_FILTERS,
  filterTemplates,
  paginateTemplates,
  sortTemplates,
  activeFilterCount,
  describeRange,
} from '../src/utils/templateQuery.js';
import { normalizeTemplateId, getTemplate, templateTheme, isLegacyTemplateId } from '../src/utils/templates.js';

test('catalogue contains at least 100 premium templates plus the six originals', () => {
  assert.equal(PREMIUM_TEMPLATE_COUNT, 100);
  assert.equal(FREE_TEMPLATE_COUNT, 6);
  assert.equal(TEMPLATE_COUNT, TEMPLATE_CATALOGUE.length);
  assert.ok(TEMPLATE_COUNT >= 106);
  assert.equal(TEMPLATE_CATALOGUE.filter((template) => template.tier === 'premium').length, 100);
});

test('every template has a unique id and a unique name', () => {
  const ids = TEMPLATE_CATALOGUE.map((template) => template.id);
  const names = TEMPLATE_CATALOGUE.map((template) => template.name);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  assert.equal(new Set(names).size, names.length, 'names are unique');
  ids.forEach((id) => assert.match(id, /^[a-z0-9-]+$/, `${id} is a stable slug id`));
});

test('each of the 100 premium entries uses a distinct layout + style pair', () => {
  const premium = TEMPLATE_CATALOGUE.filter((template) => template.tier === 'premium');
  const pairs = premium.map((template) => `${template.layout}/${template.style}`);
  assert.equal(new Set(pairs).size, 100, 'every premium template is a distinct design combination');
  assert.equal(TEMPLATE_LAYOUTS.length, 10);
  assert.equal(TEMPLATE_STYLES.length, 10);
  // Each layout is used by exactly ten premium templates.
  TEMPLATE_LAYOUTS.forEach((layout) => {
    assert.equal(premium.filter((template) => template.layout === layout.id).length, 10, `${layout.id} has ten templates`);
  });
});

test('every template declares the metadata the gallery, preview and filters rely on', () => {
  TEMPLATE_CATALOGUE.forEach((template) => {
    assert.ok(template.name, `${template.id} has a name`);
    assert.ok(template.description && template.description.length > 20, `${template.id} has a description`);
    assert.ok(TEMPLATE_CATEGORIES_LIST.includes(template.category), `${template.id} has a catalogue category`);
    assert.ok(template.categories.length >= 1, `${template.id} has categories`);
    assert.ok(Array.isArray(template.tags) && template.tags.length >= 3, `${template.id} has searchable tags`);
    assert.ok(['light', 'dark'].includes(template.appearance), `${template.id} declares an appearance`);
    assert.ok(['free', 'premium'].includes(template.tier), `${template.id} declares access`);
    assert.match(template.accent, /^#[0-9a-f]{6}$/i, `${template.id} has a hex accent`);
    assert.equal(template.swatches.length, 3, `${template.id} has three palette swatches`);
    assert.ok(!Number.isNaN(new Date(template.addedAt).getTime()), `${template.id} has an addedAt date`);
    assert.ok(template.layoutLabel && template.styleLabel, `${template.id} names its layout and style`);
  });
});

test('every requested category has at least one template', () => {
  TEMPLATE_CATEGORIES_LIST.forEach((category) => {
    assert.ok(
      TEMPLATE_CATALOGUE.some((template) => template.categories.includes(category)),
      `${category} has templates`
    );
  });
});

test('load more reveals 12 at a time until the catalogue is exhausted', () => {
  assert.equal(PAGE_SIZE, 12);
  const sorted = filterTemplates(TEMPLATE_CATALOGUE, DEFAULT_FILTERS);
  let limit = PAGE_SIZE;
  let page = paginateTemplates(sorted, limit);
  assert.equal(page.visible.length, 12);
  assert.equal(page.remaining, TEMPLATE_COUNT - 12);
  assert.equal(page.hasMore, true);

  const shown = new Set(page.visible.map((template) => template.id));
  // Simulate clicking "Load more" until the end.
  let guard = 0;
  while (page.hasMore && guard < 50) {
    limit += PAGE_SIZE;
    page = paginateTemplates(sorted, limit);
    page.visible.forEach((template) => shown.add(template.id));
    guard += 1;
  }
  assert.equal(page.hasMore, false);
  assert.equal(page.visible.length, TEMPLATE_COUNT);
  assert.equal(shown.size, TEMPLATE_COUNT);
  assert.equal(describeRange(12, TEMPLATE_COUNT), `Showing 12 of ${TEMPLATE_COUNT} templates`);
});

test('search matches names and keywords, and combines with filters', () => {
  const byName = filterTemplates(TEMPLATE_CATALOGUE, { ...DEFAULT_FILTERS, search: 'slate stack' });
  assert.ok(byName.length >= 1);
  assert.equal(byName[0].id, 'stack-slate');

  const photographer = filterTemplates(TEMPLATE_CATALOGUE, { ...DEFAULT_FILTERS, search: 'photographer' });
  assert.ok(photographer.length >= 1);
  photographer.forEach((template) => assert.ok(template.categories.includes('Photographer')));

  const glassDesigner = filterTemplates(TEMPLATE_CATALOGUE, {
    ...DEFAULT_FILTERS,
    category: 'UI/UX Designer',
    style: 'glass',
  });
  assert.ok(glassDesigner.length >= 1);
  glassDesigner.forEach((template) => {
    assert.ok(template.categories.includes('UI/UX Designer'));
    assert.equal(template.style, 'glass');
  });

  const combinedMiss = filterTemplates(TEMPLATE_CATALOGUE, {
    ...DEFAULT_FILTERS,
    category: 'Photographer',
    search: 'react hooks',
  });
  assert.equal(combinedMiss.length, 0);
});

test('appearance and access filters return only matching templates', () => {
  const dark = filterTemplates(TEMPLATE_CATALOGUE, { ...DEFAULT_FILTERS, appearance: 'dark' });
  assert.ok(dark.length > 0);
  dark.forEach((template) => assert.equal(template.appearance, 'dark'));

  const free = filterTemplates(TEMPLATE_CATALOGUE, { ...DEFAULT_FILTERS, access: 'free' });
  assert.equal(free.length, 6);
  free.forEach((template) => assert.equal(template.tier, 'free'));

  const premium = filterTemplates(TEMPLATE_CATALOGUE, { ...DEFAULT_FILTERS, access: 'premium' });
  assert.equal(premium.length, 100);
});

test('sorting supports newest, alphabetical and featured order', () => {
  const newest = sortTemplates(TEMPLATE_CATALOGUE, 'newest');
  for (let i = 1; i < newest.length; i += 1) {
    assert.ok(new Date(newest[i - 1].addedAt) >= new Date(newest[i].addedAt), 'newest-first ordering');
  }

  const alphabetical = sortTemplates(TEMPLATE_CATALOGUE, 'alphabetical');
  const names = alphabetical.map((template) => template.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));

  const featured = sortTemplates(TEMPLATE_CATALOGUE, 'featured');
  assert.equal(featured[0].tier, 'free', 'free templates lead the default view');
  const firstPremium = featured.findIndex((template) => template.tier === 'premium');
  assert.equal(firstPremium, FREE_TEMPLATE_COUNT, 'all six free templates come before premium entries');
  assert.ok(featured.slice(firstPremium).every((template) => template.tier === 'premium'), 'premium entries follow free ones');
  assert.equal(featured[firstPremium].featured, true, 'the first premium entry is a featured design');
});

test('active filter count and reset affordance are accurate', () => {
  assert.equal(activeFilterCount(DEFAULT_FILTERS), 0);
  assert.equal(activeFilterCount({ ...DEFAULT_FILTERS, search: 'glass', category: 'Photographer' }), 2);
});

test('premium ids resolve through the shared template utilities', () => {
  const premiumId = 'showcase-premiere';
  assert.equal(isPremiumTemplateId(premiumId), true);
  assert.equal(normalizeTemplateId(premiumId), premiumId);
  assert.equal(getTemplate(premiumId).id, premiumId);
  assert.equal(isLegacyTemplateId(premiumId), false);

  const theme = templateTheme(premiumId);
  assert.equal(theme.accent, getCatalogueTemplate(premiumId).accent);
  assert.ok(['sans', 'serif', 'mono'].includes(theme.font));

  // Unknown ids still fall back safely.
  assert.equal(normalizeTemplateId('not-a-real-template'), 'developer');
});

test('the catalogue map matches the list exactly', () => {
  assert.equal(Object.keys(CATALOGUE_MAP).length, TEMPLATE_COUNT);
  TEMPLATE_CATALOGUE.forEach((template) => {
    assert.equal(CATALOGUE_MAP[template.id].name, template.name);
  });
});
