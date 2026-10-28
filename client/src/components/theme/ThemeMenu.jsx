import { Moon, Sun } from 'lucide-react';
import { THEMES, useTheme } from '../../context/ThemeContext.jsx';

const ICONS = { light: Sun, dark: Moon };

/**
 * Theme switcher.
 *
 * Two options only — Dark and Light — as a compact segmented control. Icons
 * carry an accessible label and tooltip; the text label appears only where
 * there is room (the dashboard), so the header stays quiet.
 */
export default function ThemeMenu({ className = '', size = 'md', showLabels = false }) {
  const { theme, setTheme } = useTheme();
  const compact = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`inline-flex shrink-0 items-center rounded-md border border-line bg-surface p-0.5 ${className}`}
    >
      {THEMES.map((item) => {
        const Icon = ICONS[item.id];
        const active = item.id === theme;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTheme(item.id)}
            aria-pressed={active}
            aria-label={`${item.label} theme`}
            title={`${item.label} theme`}
            className={`inline-flex items-center justify-center gap-1.5 rounded transition-colors duration-150 ${
              compact ? 'h-7 px-1.5' : 'h-7 px-2'
            } ${active ? 'bg-surfaceRaised text-ink' : 'text-faint hover:text-ink'}`}
          >
            <Icon size={compact ? 13 : 14} aria-hidden="true" />
            {showLabels ? (
              <span className={`font-medium ${compact ? 'text-[11px]' : 'text-[11.5px]'}`}>{item.label}</span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
