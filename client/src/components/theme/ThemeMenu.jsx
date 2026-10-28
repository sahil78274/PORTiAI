import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { THEMES, useTheme } from '../../context/ThemeContext.jsx';

/**
 * Theme picker.
 *
 * A single trigger opens a listbox-style menu of the six themes. Each option
 * shows its own three-colour palette so the choice is visual rather than a
 * guess. Keyboard: Escape closes, arrow keys move through the options.
 */
export default function ThemeMenu({ className = '', size = 'md', align = 'right' }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const compact = size === 'sm';
  const current = THEMES.find((item) => item.id === theme) || THEMES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Opening from the keyboard puts focus on the active option, so arrow keys
  // move through the list immediately.
  useEffect(() => {
    if (!open) return;
    const active = rootRef.current?.querySelector('[role="menuitemradio"][aria-checked="true"]');
    active?.focus();
  }, [open]);

  const onMenuKeyDown = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(rootRef.current?.querySelectorAll('[role="menuitemradio"]') || []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    let next = 0;
    if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
    if (event.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1;
    if (event.key === 'End') next = items.length - 1;
    items[next]?.focus();
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Colour theme: ${current.label}. Change theme`}
        className={`inline-flex items-center gap-2 rounded-full border border-line bg-surface text-inkSoft transition-colors hover:border-lineStrong hover:text-ink ${
          compact ? 'h-8 px-2.5' : 'h-9 px-3'
        }`}
      >
        <Palette size={compact ? 14 : 15} aria-hidden="true" />
        <span className="flex items-center gap-1" aria-hidden="true">
          {current.swatches.map((color) => (
            <span
              key={color}
              className="rounded-full border border-black/10"
              style={{ background: color, height: compact ? 8 : 9, width: compact ? 8 : 9 }}
            />
          ))}
        </span>
        <span className={`hidden font-medium sm:inline ${compact ? 'text-[11.5px]' : 'text-[12.5px]'}`}>{current.label}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Colour theme"
          onKeyDown={onMenuKeyDown}
          className={`absolute z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-float animate-fadeIn ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">Theme</p>
          {THEMES.map((item) => {
            const active = item.id === theme;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(item.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? 'bg-accent-soft text-accent-hover' : 'text-inkSoft hover:bg-surfaceRaised hover:text-ink'
                }`}
              >
                <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
                  {item.swatches.map((color) => (
                    <span key={color} className="h-4 w-2.5 rounded-sm border border-black/10" style={{ background: color }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium leading-5">{item.label}</span>
                  <span className="block truncate text-[11px] leading-4 text-muted">{item.description}</span>
                </span>
                {active ? <Check size={14} className="shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
