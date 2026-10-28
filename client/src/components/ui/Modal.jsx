import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Accessible dialog: focus is moved into the dialog, Escape closes it,
 * background scroll is locked and focus returns to the trigger on close.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeLabel = 'Close dialog',
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusable = panelRef.current?.querySelector(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-overlay p-0 sm:items-center sm:p-6 animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={`relative z-10 w-full ${SIZES[size]} rounded-t-lg border border-line bg-surface shadow-float sm:rounded-lg`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title ? (
              <h2 id="modal-title" className="text-[15px] font-semibold text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id="modal-description" className="mt-0.5 text-xs text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost -mr-2 -mt-1 h-8 w-8 rounded-md p-0 text-muted hover:text-ink"
            aria-label={closeLabel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4 scroll-slim">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-canvasAlt px-6 py-3.5 rounded-b-lg">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  // `typeof document` guard keeps the component renderable in non-DOM
  // environments (the SSR smoke check); the app itself is a browser SPA.
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
