import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEMPLATES,
  TEMPLATE_MAP,
  normalizeTemplateId,
  getTemplate,
} from '../src/utils/templates.js';

import {
  emptyDraft,
  draftFromPortfolio,
  draftToPayload,
} from '../src/utils/portfolioDraft.js';

test('TEMPLATES registry contains exactly 9 documented templates', () => {
  assert.equal(TEMPLATES.length, 9);
  const ids = TEMPLATES.map((t) => t.id);
  assert.deepEqual(ids, [
    'minimal',
    'developer',
    'editorial',
    'obsidian',
    'aurora',
    'swiss',
    'neon',
    'editorialpro',
    'executive',
  ]);
});

test('every template declares the metadata the gallery relies on', () => {
  TEMPLATES.forEach((template) => {
    assert.ok(template.name, `${template.id} has a name`);
    assert.ok(template.tagline, `${template.id} has a tagline`);
    assert.ok(template.bestFor, `${template.id} declares bestFor`);
    assert.match(template.accent, /^#[0-9a-f]{6}$/i, `${template.id} has a hex accent`);
    assert.ok(Array.isArray(template.categories) && template.categories.length >= 1, `${template.id} has categories`);
    assert.ok(['light', 'dark'].includes(template.tone), `${template.id} declares a tone`);
  });
});

test('normalizeTemplateId handles canonical IDs correctly', () => {
  assert.equal(normalizeTemplateId('minimal'), 'minimal');
  assert.equal(normalizeTemplateId('developer'), 'developer');
  assert.equal(normalizeTemplateId('editorial'), 'editorial');
});

test('normalizeTemplateId handles casing and whitespace', () => {
  assert.equal(normalizeTemplateId('  Developer  '), 'developer');
  assert.equal(normalizeTemplateId('EDITORIAL'), 'editorial');
  assert.equal(normalizeTemplateId('Minimal'), 'minimal');
});

test('normalizeTemplateId handles template aliases', () => {
  assert.equal(normalizeTemplateId('developer-portfolio'), 'developer');
  assert.equal(normalizeTemplateId('modern-editorial'), 'editorial');
  assert.equal(normalizeTemplateId('minimal-professional'), 'minimal');
  assert.equal(normalizeTemplateId('obsidian-pro'), 'obsidian');
  assert.equal(normalizeTemplateId('aurora-gradient'), 'aurora');
  assert.equal(normalizeTemplateId('swiss-minimal'), 'swiss');
  assert.equal(normalizeTemplateId('neon-terminal'), 'neon');
  assert.equal(normalizeTemplateId('editorial-pro'), 'editorialpro');
  assert.equal(normalizeTemplateId('executive-elite'), 'executive');
});

test('the nine new template ids normalise to themselves', () => {
  ['obsidian', 'aurora', 'swiss', 'neon', 'editorialpro', 'executive'].forEach((id) => {
    assert.equal(normalizeTemplateId(id), id);
    assert.equal(getTemplate(id).id, id);
  });
});

test('normalizeTemplateId safely falls back to minimal on missing or unknown input', () => {
  assert.equal(normalizeTemplateId(''), 'minimal');
  assert.equal(normalizeTemplateId(null), 'minimal');
  assert.equal(normalizeTemplateId(undefined), 'minimal');
  assert.equal(normalizeTemplateId('nonexistent-template'), 'minimal');
  assert.equal(normalizeTemplateId(123), 'minimal');
});

test('getTemplate returns matching template object or minimal fallback', () => {
  const dev = getTemplate('developer');
  assert.equal(dev.id, 'developer');
  assert.equal(dev.accent, '#1f5c4a');

  const ed = getTemplate('editorial');
  assert.equal(ed.id, 'editorial');
  assert.equal(ed.accent, '#8a3a2f');

  const min = getTemplate('minimal');
  assert.equal(min.id, 'minimal');
  assert.equal(min.accent, '#2f4a8b');

  const unknown = getTemplate('something-else');
  assert.equal(unknown.id, 'minimal');
});

test('draftFromPortfolio preserves chosen templateId and normalises invalid ones', () => {
  const devDraft = draftFromPortfolio({ title: 'Dev', templateId: 'developer' });
  assert.equal(devDraft.templateId, 'developer');

  const edDraft = draftFromPortfolio({ title: 'Ed', templateId: 'editorial' });
  assert.equal(edDraft.templateId, 'editorial');

  const legacyDraft = draftFromPortfolio({ title: 'Legacy', template: 'developer-portfolio' });
  assert.equal(legacyDraft.templateId, 'developer');

  const brokenDraft = draftFromPortfolio({ title: 'Broken', templateId: 'unknown-id' });
  assert.equal(brokenDraft.templateId, 'minimal');
});

test('draftToPayload preserves canonical templateId in outgoing payload', () => {
  const draft = {
    ...emptyDraft(),
    title: 'My Work',
    templateId: 'developer',
  };
  const payload = draftToPayload(draft);
  assert.equal(payload.templateId, 'developer');
  assert.equal(payload.title, 'My Work');
});
