import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const editorPage = readFileSync(new URL('../src/pages/Editor.jsx', import.meta.url), 'utf8');
const portfolioForm = readFileSync(new URL('../src/components/editor/PortfolioForm.jsx', import.meta.url), 'utf8');
const templatePicker = readFileSync(new URL('../src/components/templates/TemplatePicker.jsx', import.meta.url), 'utf8');
const primitives = readFileSync(new URL('../src/components/ui/Primitives.jsx', import.meta.url), 'utf8');

test('editor form pane establishes an inline-size container and prevents horizontal overflow', () => {
  assert.match(editorPage, /\beditor-form-pane\b/, 'Editor.jsx attaches editor-form-pane to the form scroll area');
  assert.match(css, /\.editor-form-pane\s*\{[\s\S]*?container-type:\s*inline-size;/, 'container-type is inline-size');
  assert.match(css, /\.editor-form-pane\s*\{[\s\S]*?container-name:\s*editor-form;/, 'container-name is editor-form');
  assert.match(css, /\.editor-form-pane\s*\{[\s\S]*?overflow-x:\s*hidden;/, 'horizontal overflow is prevented');
});

test('editor form grids stack in narrow panels and only expand via @container queries', () => {
  assert.match(
    css,
    /\.editor-grid-2,\s*\.editor-grid-2-wide\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    'grids stack into a single full-width column by default'
  );
  assert.match(
    css,
    /@container editor-form \(min-width:\s*520px\)\s*\{[\s\S]*?\.editor-grid-2\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    '2-column layout only activates when the form container itself has enough width'
  );
  assert.match(
    css,
    /@container editor-picker \(min-width:\s*440px\)\s*\{[\s\S]*?\.editor-picker-grid\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    'template picker cards stack in narrow panels and expand at >=440px container width'
  );

  // Viewport-based multi-column utilities inside PortfolioForm / TemplatePicker
  // break on desktop because the viewport is >=1280px while the editor panel is narrow.
  for (const [name, source] of [
    ['PortfolioForm.jsx', portfolioForm],
    ['TemplatePicker.jsx', templatePicker],
  ]) {
    assert.doesNotMatch(source, /\bsm:grid-cols-[23]\b/, `${name} has no viewport-based multi-column grid`);
    assert.doesNotMatch(source, /\bsm:flex-row\b/, `${name} has no viewport-based horizontal row split`);
    assert.doesNotMatch(source, /\bsm:w-\d+\b/, `${name} has no fixed viewport-based width that cramps narrow panels`);
  }
});

test('form controls and field wrappers enforce full width and min-width: 0', () => {
  assert.match(css, /\.input\s*\{[\s\S]*?\bmin-w-0\b[\s\S]*?\bw-full\b/, '.input uses min-w-0 and w-full');
  assert.match(primitives, /flex min-w-0 flex-col gap-1\.5/, 'Field wrapper enforces min-w-0 and uniform vertical rhythm');
  assert.match(
    primitives,
    /items-baseline justify-between gap-x-2/,
    'Field label keeps optional indicator separated and baseline-aligned'
  );
});

test('all Portfolio Editor field IDs and section exports are preserved', () => {
  for (const exported of [
    'ProfileSection',
    'SkillsSection',
    'EducationSection',
    'ProjectsSection',
    'ExperienceSection',
    'DesignSection',
    'SectionsSection',
  ]) {
    assert.match(portfolioForm, new RegExp(`export function ${exported}\\b`), `${exported} is exported`);
  }

  for (const fieldId of [
    'fullName',
    'proTitle',
    'location',
    'contactEmail',
    'photoUrl',
    'summary',
    'bio',
    'github',
    'linkedin',
    'website',
    'twitter',
    'skillName',
    'skillCategory',
    'theme-font',
    'theme-density',
  ]) {
    assert.match(portfolioForm, new RegExp(`id="${fieldId}"`), `field #${fieldId} is preserved`);
  }

  for (const blogId of ['blog-title', 'blog-intro']) {
    assert.match(editorPage, new RegExp(`id="${blogId}"`), `blog field #${blogId} is preserved`);
  }
});
