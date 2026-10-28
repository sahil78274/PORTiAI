import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { TEMPLATE_CATALOGUE } from '../src/data/templateCatalogue.js';
import { getStyle } from '../src/data/templateStyles.js';

/**
 * Theme + preview contrast regression tests.
 *
 * The six app themes and the ten template styles are plain CSS token sets, so
 * they can be checked without a browser: the tests parse the tokens and assert
 * WCAG contrast for the pairs the interface actually renders (body text,
 * secondary text, accent text and text on an accent fill).
 */

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const themeContext = readFileSync(new URL('../src/context/ThemeContext.jsx', import.meta.url), 'utf8');

const THEME_IDS = ['light', 'dark', 'midnight', 'purple', 'emerald', 'rose'];

const parseBlock = (body) =>
  Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));

const themeBlocks = [...css.matchAll(/html\[data-theme='([a-z]+)'\]\s*\{([\s\S]*?)\n\s*\}/g)].map((match) => ({
  id: match[1],
  tokens: parseBlock(match[2]),
}));

const THRESHOLDS = [
  ['ink', 'canvas', 4.5, 'body text on the page background'],
  ['ink', 'surface', 4.5, 'body text on cards'],
  ['ink-soft', 'surface', 4.5, 'secondary text on cards'],
  ['muted', 'canvas', 4.5, 'muted text on the page background'],
  ['muted', 'surface', 4.5, 'muted text on cards'],
  ['accent', 'canvas', 3, 'accent text/icons on the page background'],
  ['accent-hover', 'canvas', 3, 'accent hover text on the page background'],
  ['accent-contrast', 'accent', 4.5, 'text on an accent button'],
  ['success', 'surface', 4.5, 'success text on cards'],
  ['warning', 'surface', 4.5, 'warning text on cards'],
  ['danger', 'surface', 4.5, 'danger text on cards'],
];

const toRgb = (hex) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? [...clean].map((char) => char + char).join('') : clean;
  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16));
};

const luminance = ([r, g, b]) => {
  const channel = (value) => {
    const normalised = value / 255;
    return normalised <= 0.03928 ? normalised / 12.92 : ((normalised + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const [high, low] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

const isHex = (value) => /^#[0-9a-f]{3,8}$/i.test(value || '');

test('all six themes are defined as CSS token blocks', () => {
  assert.deepEqual(
    themeBlocks.map((theme) => theme.id),
    THEME_IDS,
    'index.css declares exactly the six documented themes'
  );
  themeBlocks.forEach((theme) => {
    assert.ok(Object.keys(theme.tokens).length >= 35, `${theme.id} defines a full palette`);
    ['canvas', 'surface', 'ink', 'muted', 'line', 'accent', 'accent-contrast', 'hero-glow'].forEach((token) => {
      assert.ok(theme.tokens[token], `${theme.id} defines --${token}`);
    });
  });
});

test('the theme picker, the CSS blocks and the pre-paint script agree', () => {
  const pickerIds = [...themeContext.matchAll(/\{ id: '([a-z]+)', label:/g)].map((match) => match[1]);
  assert.deepEqual(pickerIds, THEME_IDS, 'the picker lists every theme');
  THEME_IDS.forEach((id) => assert.ok(css.includes(`html[data-theme='${id}']`), `${id} has a CSS block`));
  assert.match(html, /localStorage\.getItem\('portiai\.theme'\)/, 'the stored theme is read before paint');
  assert.match(html, /documentElement\.dataset\.theme/, 'the pre-paint script sets data-theme');
  assert.match(html, /classList\.(add|toggle)\('dark'/, 'the pre-paint script keeps the dark class in sync');
});

test('every theme meets WCAG contrast for the pairs the UI renders', () => {
  themeBlocks.forEach((theme) => {
    THRESHOLDS.forEach(([fg, bg, minimum, description]) => {
      const foreground = theme.tokens[fg];
      const background = theme.tokens[bg];
      if (!isHex(foreground) || !isHex(background)) return; // gradients/translucency are checked visually
      const ratio = contrast(foreground, background);
      assert.ok(
        ratio >= minimum,
        `${theme.id}: ${description} is ${ratio.toFixed(2)}:1, expected at least ${minimum}:1`
      );
    });
  });
});

test('premium template palettes keep text readable on their own background', () => {
  const failures = [];
  TEMPLATE_CATALOGUE.filter((template) => template.tier === 'premium').forEach((template) => {
    const { tokens, preview } = getStyle(template.style);
    const [background] = preview;
    if (contrast(tokens.ink, background) < 4.5) failures.push(`${template.id}: body text on ${background}`);
    if (contrast(tokens.muted, background) < 3) failures.push(`${template.id}: muted text on ${background}`);
    if (contrast(tokens.accentInk, template.accent) < 3) {
      failures.push(`${template.id}: text on the ${template.accent} accent fill`);
    }
  });
  assert.deepEqual(failures, [], `contrast problems: ${failures.join('; ')}`);
});
