import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Colour themes.
 *
 * The palette itself lives in `src/index.css` (one block per theme). This
 * context only decides which one is active: it sets `data-theme` plus the
 * `dark` class on <html> before React paints (see the inline script in
 * index.html), and it persists the choice in localStorage.
 */
export const THEMES = [
  { id: 'light', label: 'Light', description: 'Clean white surfaces, blue accent', dark: false, swatches: ['#ffffff', '#eef1f5', '#2563eb'] },
  { id: 'dark', label: 'Dark', description: 'Deep slate, cool blue accent', dark: true, swatches: ['#0b1120', '#172137', '#2f68f5'] },
  { id: 'midnight', label: 'Midnight', description: 'Near-black blue with cyan light', dark: true, swatches: ['#05070d', '#121a28', '#38bdf8'] },
  { id: 'purple', label: 'Purple', description: 'Violet night with soft lavender', dark: true, swatches: ['#0c0716', '#1d1333', '#a78bfa'] },
  { id: 'emerald', label: 'Emerald', description: 'Forest dark with mint accent', dark: true, swatches: ['#04120e', '#0b241b', '#34d399'] },
  { id: 'rose', label: 'Rose', description: 'Warm blush paper, crimson accent', dark: false, swatches: ['#fff7f8', '#fbe6ea', '#be123c'] },
];

export const THEME_MAP = Object.fromEntries(THEMES.map((theme) => [theme.id, theme]));
export const DEFAULT_THEME = 'light';
const STORAGE_KEY = 'portiai.theme';

const ThemeContext = createContext(null);

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const isThemeId = (value) => Boolean(value && THEME_MAP[value]);

export const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const resolveInitialTheme = () => readStoredTheme() || (systemPrefersDark() ? 'dark' : DEFAULT_THEME);

const metaColor = (theme) => THEME_MAP[theme]?.swatches?.[0] || '#ffffff';

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

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialTheme);
  // Tracks whether the user has expressed a preference. Until then, follow the OS.
  const [followSystem, setFollowSystem] = useState(() => readStoredTheme() === null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!followSystem || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setThemeState(event.matches ? 'dark' : DEFAULT_THEME);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [followSystem]);

  const setTheme = useCallback((next) => {
    if (!isThemeId(next)) return;
    setThemeState(next);
    setFollowSystem(false);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable (private mode); the session still works */
    }
  }, []);

  /** Kept for existing call sites: flips between the light and dark themes. */
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = THEME_MAP[current]?.dark ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
    setFollowSystem(false);
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
