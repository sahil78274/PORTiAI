import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { TEMPLATE_CATALOGUE } from '../src/data/templateCatalogue.js';
import { getStyle } from '../src/data/templateStyles.js';

/**
 * Theme + preview contrast regression tests.
 *
 * The two app themes (Light, Dark) and the ten template styles are plain CSS
 * token sets, so they can be checked without a browser: the tests parse the
 * tokens and assert WCAG contrast for the pairs the interface actually renders
 * (body text, secondary text, accent text and text on an accent fill).
 *
 * They also guard the theme contract itself: exactly two themes, no leftovers
 * from the earlier five-theme palette, and dark as the default.
 */

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const themeContext = readFileSync(new URL('../src/context/ThemeContext.jsx', import.meta.url), 'utf8');

const THEME_IDS = ['light', 'dark'];
const RETIRED_THEMES = ['midnight', 'purple', 'emerald', 'rose'];

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
  ['line-strong', 'surface', 3, 'control borders on cards'],
  ['faint', 'surface', 3, 'tertiary labels on cards'],
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

test('exactly two themes are defined as CSS token blocks', () => {
  assert.deepEqual(
    themeBlocks.map((theme) => theme.id),
    THEME_IDS,
    'index.css declares exactly Light and Dark'
  );
  themeBlocks.forEach((theme) => {
    assert.ok(Object.keys(theme.tokens).length >= 35, `${theme.id} defines a full palette`);
    ['canvas', 'surface', 'ink', 'muted', 'line', 'accent', 'accent-contrast', 'hero-glow'].forEach((token) => {
      assert.ok(theme.tokens[token], `${theme.id} defines --${token}`);
    });
  });
});

test('the theme switcher, the CSS blocks and the pre-paint script agree', () => {
  const pickerIds = [...themeContext.matchAll(/id: '(light|dark)',/g)].map((match) => match[1]);
  assert.deepEqual(pickerIds, THEME_IDS, 'the switcher lists exactly Light and Dark');
  THEME_IDS.forEach((id) => assert.ok(css.includes(`html[data-theme='${id}']`), `${id} has a CSS block`));
  assert.match(html, /localStorage\.getItem\('portiai\.theme'\)/, 'the stored theme is read before paint');
  assert.match(html, /documentElement\.dataset\.theme/, 'the pre-paint script sets data-theme');
  assert.match(html, /classList\.toggle\('dark'/, 'the pre-paint script keeps the dark class in sync');
  assert.match(html, /var allowed = \['light', 'dark'\]/, 'the pre-paint script only accepts two themes');
});

test('retired themes are gone from the CSS, the context and the markup', () => {
  RETIRED_THEMES.forEach((id) => {
    assert.ok(!css.includes(`data-theme='${id}'`), `${id} has no CSS block`);
    assert.ok(!themeContext.includes(`id: '${id}'`), `${id} is not offered by the switcher`);
    assert.ok(!html.includes(`'${id}'`), `${id} is not listed in the pre-paint script`);
  });
  assert.ok(
    !/\b(midnight|purple|emerald|rose)\b/i.test(css),
    'the stylesheet has no retired palette tokens'
  );
});

test('dark is the default theme and light is the counterpart', () => {
  assert.match(themeContext, /export const DEFAULT_THEME = 'dark'/, 'dark is the primary design');
  assert.match(html, /<html lang="en" data-theme="dark">/, 'the document starts in dark mode');
  const dark = themeBlocks.find((theme) => theme.id === 'dark').tokens;
  const light = themeBlocks.find((theme) => theme.id === 'light').tokens;
  // The near-black canvas and its charcoal surfaces.
  assert.equal(dark.canvas.toLowerCase(), '#0a0a0a');
  assert.equal(dark.surface.toLowerCase(), '#111111');
  assert.equal(dark.ink.toLowerCase(), '#f5f5f5');
  assert.equal(dark.muted.toLowerCase(), '#a1a1aa');
  assert.equal(dark.line.toLowerCase(), '#262626');
  // Same layout on paper: white surfaces, near-black text, same accent hue.
  assert.equal(light.canvas.toLowerCase(), '#fafafa');
  assert.equal(light.surface.toLowerCase(), '#ffffff');
  assert.equal(light.ink.toLowerCase(), '#0a0a0a');
  // One accent only, and decorative gradients are switched off.
  assert.equal(dark['hero-glow'], 'none');
  assert.equal(light['hero-glow'], 'none');
});

/**
 * Runs the inline pre-paint script from index.html against stub DOM objects.
 * This is the script that decides which theme the page opens in, so it is the
 * real "does the saved choice survive a refresh" behaviour.
 */
const runPrePaint = (stored) => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const root = {
    dataset: {},
    classList: {
      value: [],
      toggle(name, force) {
        this.value = force ? [...new Set([...this.value, name])] : this.value.filter((item) => item !== name);
      },
      contains(name) {
        return this.value.includes(name);
      },
    },
    style: {},
  };
  const meta = { attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
  const context = {
    window: { matchMedia: () => ({ matches: true }) },
    document: {
      documentElement: root,
      querySelector: () => meta,
    },
    localStorage: { getItem: () => stored ?? null },
    Date,
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  return { root, meta };
};

test('the pre-paint script opens dark by default and preserves a saved choice', () => {
  const fresh = runPrePaint(null);
  assert.equal(fresh.root.dataset.theme, 'dark', 'a new visitor gets the dark interface');
  assert.equal(fresh.root.classList.contains('dark'), true);
  assert.equal(fresh.meta.attrs.content, '#0a0a0a');

  const savedLight = runPrePaint('light');
  assert.equal(savedLight.root.dataset.theme, 'light', 'the saved light choice survives a refresh');
  assert.equal(savedLight.root.classList.contains('dark'), false, 'the dark class is removed');
  assert.equal(savedLight.root.style.colorScheme, 'light');
  assert.equal(savedLight.meta.attrs.content, '#ffffff');

  const savedDark = runPrePaint('dark');
  assert.equal(savedDark.root.dataset.theme, 'dark');
  assert.equal(savedDark.root.style.colorScheme, 'dark');
});

test('saved values from the retired themes fall back to dark instead of breaking', () => {
  RETIRED_THEMES.forEach((retired) => {
    const { root } = runPrePaint(retired);
    assert.equal(root.dataset.theme, 'dark', `${retired} falls back to the default theme`);
    assert.equal(root.classList.contains('dark'), true);
  });
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
