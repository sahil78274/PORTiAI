import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * Light / dark segmented switch.
 *
 * Two explicit buttons rather than a single icon: both states are visible at a
 * glance and each has a comfortable 32px+ hit area with an accessible label.
 * The whole app follows the choice through the theme provider.
 */
export default function ThemeToggle({ className = '', size = 'md' }) {
  const { theme, setTheme } = useTheme();
  const compact = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`inline-flex items-center gap-0.5 rounded-md border border-line bg-surface p-0.5 ${className}`}
    >
      {[
        { id: 'light', label: 'Light theme', Icon: Sun },
        { id: 'dark', label: 'Dark theme', Icon: Moon },
      ].map(({ id, label, Icon }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`inline-flex items-center justify-center rounded-[4px] transition-colors duration-150 ${
              compact ? 'h-7 w-7' : 'h-8 w-8'
            } ${
              active
                ? 'bg-accent-soft text-accent-hover'
                : 'text-faint hover:bg-surfaceRaised hover:text-ink'
            }`}
          >
            <Icon size={compact ? 14 : 15} aria-hidden="true" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
