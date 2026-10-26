import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEMPLATES,
  TEMPLATE_MAP,
  TEMPLATE_CATEGORIES,
  normalizeTemplateId,
  getTemplate,
  DEFAULT_TEMPLATE_ID,
} from '../src/utils/templates.js';

import {
  emptyDraft,
  draftFromPortfolio,
  draftToPayload,
} from '../src/utils/portfolioDraft.js';

const CANONICAL_IDS = ['developer', 'dark', 'designer', 'student', 'freelancer', 'executive'];

test('TEMPLATES registry contains exactly the six documented templates', () => {
  assert.equal(TEMPLATES.length, 6);
  assert.deepEqual(TEMPLATES.map((t) => t.id), CANONICAL_IDS);
});

test('every template declares the metadata the gallery relies on', () => {
  TEMPLATES.forEach((template) => {
    assert.ok(template.name, `${template.id} has a name`);
    assert.ok(template.tagline, `${template.id} has a tagline`);
    assert.ok(template.description, `${template.id} has a description`);
    assert.ok(template.bestFor, `${template.id} declares bestFor`);
    assert.match(template.accent, /^#[0-9a-f]{6}$/i, `${template.id} has a hex accent`);
    assert.ok(Array.isArray(template.categories) && template.categories.length >= 1, `${template.id} has categories`);
    assert.ok(['light', 'dark'].includes(template.tone), `${template.id} declares a tone`);
    assert.ok(Array.isArray(template.traits) && template.traits.length >= 2, `${template.id} declares traits`);
    assert.ok(Array.isArray(template.swatches) && template.swatches.length === 3, `${template.id} has three swatches`);
  });
});

test('every template category is offered as a filter', () => {
  TEMPLATES.forEach((template) => {
    template.categories.forEach((category) => {
      assert.ok(TEMPLATE_CATEGORIES.includes(category), `${category} is a filter option`);
    });
  });
});

test('template accents are distinct and readable on their own canvas', () => {
  const accents = TEMPLATES.map((template) => template.accent);
  assert.equal(new Set(accents).size, accents.length, 'each template has its own accent');

  TEMPLATES.forEach((template) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(template.accent.slice(i, i + 2), 16));
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // A neon accent has at least one channel at full intensity and another near zero.
    assert.ok(!(max === 0xff && min < 0x20), `${template.id} accent is not a neon hue`);
    assert.ok(max - min < 0xff, `${template.id} accent is not fully saturated`);
  });
});

test('normalizeTemplateId handles canonical IDs, casing and whitespace', () => {
  assert.equal(normalizeTemplateId('developer'), 'developer');
  assert.equal(normalizeTemplateId('Designer'), 'designer');
  assert.equal(normalizeTemplateId('  EXECUTIVE  '), 'executive');
});

test('normalizeTemplateId maps legacy ids onto the current six', () => {
  assert.equal(normalizeTemplateId('minimal'), 'student');
  assert.equal(normalizeTemplateId('minimal-professional'), 'student');
  assert.equal(normalizeTemplateId('editorial'), 'designer');
  assert.equal(normalizeTemplateId('modern-editorial'), 'designer');
  assert.equal(normalizeTemplateId('aurora-gradient'), 'designer');
  assert.equal(normalizeTemplateId('obsidian-pro'), 'dark');
  assert.equal(normalizeTemplateId('neon-terminal'), 'dark');
  assert.equal(normalizeTemplateId('swiss-minimal'), 'executive');
  assert.equal(normalizeTemplateId('executive-elite'), 'executive');
  assert.equal(normalizeTemplateId('developer-portfolio'), 'developer');
  assert.equal(normalizeTemplateId('modern-freelancer'), 'freelancer');
});

test('normalizeTemplateId safely falls back to the default template', () => {
  assert.equal(DEFAULT_TEMPLATE_ID, 'developer');
  ['', null, undefined, 'nonexistent-template', 123].forEach((value) => {
    assert.equal(normalizeTemplateId(value), DEFAULT_TEMPLATE_ID);
  });
});

test('getTemplate returns the matching template or the default fallback', () => {
  assert.equal(getTemplate('developer').id, 'developer');
  assert.equal(getTemplate('designer').id, 'designer');
  assert.equal(getTemplate('something-else').id, DEFAULT_TEMPLATE_ID);
  CANONICAL_IDS.forEach((id) => {
    assert.equal(TEMPLATE_MAP[id].id, id);
    assert.equal(getTemplate(id).id, id);
  });
});

test('draftFromPortfolio preserves chosen templateId and normalises invalid ones', () => {
  assert.equal(draftFromPortfolio({ title: 'Dev', templateId: 'developer' }).templateId, 'developer');
  assert.equal(draftFromPortfolio({ title: 'Ed', templateId: 'designer' }).templateId, 'designer');
  assert.equal(draftFromPortfolio({ title: 'Legacy', templateId: 'obsidian' }).templateId, 'dark');
  assert.equal(draftFromPortfolio({ title: 'Broken', templateId: 'unknown-id' }).templateId, DEFAULT_TEMPLATE_ID);
});

test('draftToPayload preserves the canonical templateId in the outgoing payload', () => {
  const draft = { ...emptyDraft(), title: 'My Work', templateId: 'freelancer' };
  const payload = draftToPayload(draft);
  assert.equal(payload.templateId, 'freelancer');
  assert.equal(payload.title, 'My Work');
});
