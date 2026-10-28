import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Colour themes.
 *
 * PortiAI ships exactly two themes: **Light** and **Dark**. (Dark is the primary
 * design — a near-black canvas with one restrained amber accent.) The palette
 * itself lives in `src/index.css`, one token block per theme; this context only
 * decides which one is active: it sets `data-theme` plus the `dark` class on
 * <html> (the inline script in index.html does the same before first paint) and
 * persists the choice in localStorage.
 */
export const THEMES = [
  {
    id: 'light',
    label: 'Light',
    description: 'Paper canvas, charcoal text',
    dark: false,
    swatches: ['#fafafa', '#ffffff', '#a16207'],
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Near-black canvas, warm accent',
    dark: true,
    swatches: ['#0a0a0a', '#111111', '#e8b45a'],
  },
];

export const THEME_MAP = Object.fromEntries(THEMES.map((theme) => [theme.id, theme]));
/** Dark is the primary design, so it is what a first-time visitor sees. */
export const DEFAULT_THEME = 'dark';
const STORAGE_KEY = 'portiai.theme';

const ThemeContext = createContext(null);

export const isThemeId = (value) => Boolean(value && THEME_MAP[value]);

export const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Values written by earlier releases (midnight, purple, …) are ignored;
    // the default theme applies instead.
    return isThemeId(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const resolveInitialTheme = () => readStoredTheme() || DEFAULT_THEME;

const metaColor = (theme) => (theme === 'dark' ? '#0a0a0a' : '#ffffff');

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const config = THEME_MAP[theme] || THEME_MAP[DEFAULT_THEME];
  root.dataset.theme = config.id;
  root.classList.toggle('dark', config.dark);
  root.style.colorScheme = config.dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', metaColor(config.id));
};

const storeTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage may be unavailable (private mode); the session still works */
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!isThemeId(next)) return;
    setThemeState(next);
    storeTheme(next);
  }, []);

  /** Flips between the two themes. */
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      storeTheme(next);
      return next;
    });
  }, []);

  const config = THEME_MAP[theme] || THEME_MAP[DEFAULT_THEME];

  const value = useMemo(
    () => ({
      theme,
      config,
      themes: THEMES,
      isDark: Boolean(config.dark),
      setTheme,
      toggleTheme,
    }),
    [theme, config, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
