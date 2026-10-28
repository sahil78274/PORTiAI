import ThemeMenu from '../theme/ThemeMenu.jsx';

/**
 * Theme control used across the app.
 *
 * Kept as a thin wrapper around <ThemeMenu /> so every existing layout keeps
 * working: the app now offers six themes instead of a light/dark pair.
 */
export default function ThemeToggle({ className = '', size = 'md', align = 'right' }) {
  return <ThemeMenu className={className} size={size} align={align} />;
}
