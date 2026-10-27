import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

/* -------------------------------------------------- Tooltip -------------------------------------------------- */
export const Tooltip = ({ label, children, side = 'top' }) => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 hidden whitespace-nowrap rounded border border-lineStrong bg-surface px-2 py-1 text-[10px] font-medium text-inkSoft shadow-raised group-hover:block group-focus-within:block ${positions[side]}`}
      >
        {label}
      </span>
    </span>
  );
};

/* -------------------------------------------------- Section heading -------------------------------------------------- */
export const SectionHeading = ({ eyebrow, title, description, align = 'left', className = '', actions }) => (
  <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-2 text-balance text-[26px] font-semibold tracking-[-0.025em] text-ink">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
  </div>
);

/* -------------------------------------------------- Stat card -------------------------------------------------- */
const TONES = {
  indigo: 'text-accent-hover',
  violet: 'text-accent',
  emerald: 'text-success',
  amber: 'text-warning',
};

export const StatCard = ({ icon: Icon, label, value, hint, tone = 'indigo', loading = false, to, trend }) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md border border-line bg-canvas ${TONES[tone] || TONES.indigo}`}>
          {Icon ? <Icon size={16} aria-hidden="true" /> : null}
        </span>
        {trend ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-successLine bg-successSoft px-1.5 py-0.5 text-[10px] font-medium text-success">
            <TrendingUp size={9} aria-hidden="true" />
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{label}</p>
      {loading ? <div className="skeleton mt-2 h-7 w-16" /> : <p className="mt-0.5 text-[22px] font-semibold leading-tight tabular-nums tracking-[-0.02em] text-ink">{value}</p>}
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-muted">{hint}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card group p-4">
        {body}
      </Link>
    );
  }
  return <div className="card p-4">{body}</div>;
};

/* -------------------------------------------------- Page header -------------------------------------------------- */
export const PageHeader = ({ eyebrow, title, description, actions, className = '' }) => (
  <header className={`flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="min-w-0">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="mt-1.5 text-balance text-[20px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
);

/* -------------------------------------------------- Smart image -------------------------------------------------- */
export const SmartImage = ({ src, alt = '', className = '', ratio = 'aspect-[16/10]', fallbackSeed = 0, ...props }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden border border-line bg-canvasAlt ${ratio} ${className}`}
        role={alt ? 'img' : 'presentation'}
        aria-label={alt || undefined}
      >
        <svg viewBox="0 0 48 48" className="h-7 w-7 text-faint" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="9" width="36" height="30" rx="2.5" />
          <circle cx="17" cy="19" r="3" />
          <path d="M8 34l10-9 7 6 6-4 9 7" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${ratio} w-full object-cover ${className}`}
      {...props}
    />
  );
};

/* -------------------------------------------------- Dropdown -------------------------------------------------- */
export const Dropdown = ({ trigger, children, align = 'right', className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="inline-flex">
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-40 mt-2 min-w-[190px] overflow-hidden rounded-lg border border-lineStrong bg-surface py-1 shadow-float animate-fadeIn ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export const DropdownItem = ({ icon: Icon, children, onClick, to, danger = false, ...props }) => {
  const className = `flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
    danger ? 'text-danger hover:bg-dangerSoft' : 'text-inkSoft hover:bg-canvasAlt hover:text-ink'
  }`;
  const content = (
    <>
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className} role="menuitem" {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" onClick={onClick} className={className} {...props}>
      {content}
    </button>
  );
};

/* -------------------------------------------------- Copy button -------------------------------------------------- */
export const CopyButton = ({ value, label = 'Copy link', className = 'btn-secondary btn-sm', toastMessage = 'Link copied to clipboard.' }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastMessage);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.info('Copy this manually:', { description: value, duration: 9000 });
    }
  };

  return (
    <button type="button" onClick={copy} className={className} title={label}>
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
};

/* -------------------------------------------------- Loading button -------------------------------------------------- */
export const LoadingButton = ({ loading, children, className = 'btn-primary', ...props }) => (
  <button type="button" className={className} disabled={loading || props.disabled} aria-busy={loading} {...props}>
    {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
    {children}
  </button>
);
