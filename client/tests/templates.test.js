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

test('TEMPLATES registry contains exactly 3 documented templates', () => {
  assert.equal(TEMPLATES.length, 3);
  const ids = TEMPLATES.map((t) => t.id);
  assert.deepEqual(ids, ['minimal', 'developer', 'editorial']);
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
