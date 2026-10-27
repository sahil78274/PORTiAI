import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Centralised colour theme.
 *
 * - The initial class is applied by the inline script in `index.html` *before*
 *   React mounts, so the first paint already has the right palette.
 * - The choice is stored in localStorage under `portiai.theme`.
 * - With no stored choice we follow the operating system preference.
 * - The applied theme is the `dark` class on <html>, which drives every CSS
 *   token in `index.css`, so all routes and components switch together.
 */
const STORAGE_KEY = 'portiai.theme';
const ThemeContext = createContext(null);

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
};

export const resolveInitialTheme = () => readStoredTheme() || (systemPrefersDark() ? 'dark' : 'light');

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1120' : '#ffffff');
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  // Tracks whether the user has expressed a preference. Until then, follow the OS.
  const [followSystem, setFollowSystem] = useState(() => readStoredTheme() === null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!followSystem || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setTheme(event.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [followSystem]);

  const set = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light';
    setTheme(value);
    setFollowSystem(false);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage may be unavailable (private mode); the session still works */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      setFollowSystem(false);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', setTheme: set, toggleTheme: toggle }), [theme, set, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
