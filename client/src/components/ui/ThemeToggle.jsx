import ThemeMenu from '../theme/ThemeMenu.jsx';

/**
 * Theme control used across the app.
 *
 * A thin wrapper around <ThemeMenu /> so every existing layout keeps working;
 * the switcher now offers exactly two themes, Light and Dark.
 */
export default function ThemeToggle({ className = '', size = 'md' }) {
  return <ThemeMenu className={className} size={size} />;
}
