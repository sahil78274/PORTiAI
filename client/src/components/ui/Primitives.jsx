import { forwardRef, useId } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

/* -------------------------------------------------- Button -------------------------------------------------- */
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  link: 'btn-link',
};

const SIZES = {
  xs: 'h-7 px-2 text-2xs rounded',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={size === 'xs' || size === 'sm' ? 13 : 15} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

/* -------------------------------------------------- Fields -------------------------------------------------- */
export const Field = ({ label, htmlFor, hint, error, required, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    {label ? (
      <label htmlFor={htmlFor} className="label flex items-center justify-between">
        <span className="flex items-center gap-1">
          {label}
          {required ? <span className="text-danger" aria-hidden="true">*</span> : null}
        </span>
        {!required ? <span className="text-2xs font-normal lowercase tracking-normal text-slate-400">optional</span> : null}
      </label>
    ) : null}
    {children}
    {error ? (
      <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-danger">
        <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p className="hint">{hint}</p>
    ) : null}
  </div>
);

export const TextInput = forwardRef(function TextInput({ className = '', ...props }, ref) {
  return <input ref={ref} className={`input ${className}`} {...props} />;
});

export const TextArea = forwardRef(function TextArea({ className = '', rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`textarea ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`select ${className}`} {...props}>
      {children}
    </select>
  );
});

/* -------------------------------------------------- Feedback -------------------------------------------------- */
const ALERT_STYLES = {
  info: {
    container: 'border-accent-line/80 bg-accent-soft/80 text-ink',
    icon: Info,
    iconColor: 'text-accent',
  },
  success: {
    container: 'border-success/30 bg-successSoft text-success',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  warning: {
    container: 'border-warning/30 bg-warningSoft text-warning',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  error: {
    container: 'border-danger/30 bg-dangerSoft text-danger',
    icon: AlertCircle,
    iconColor: 'text-danger',
  },
};

export const Alert = ({ tone = 'info', title, children, className = '', actions }) => {
  const style = ALERT_STYLES[tone] || ALERT_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${style.container} ${className}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${style.iconColor}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold leading-snug">{title}</p> : null}
        {children ? (
          <div className={`leading-relaxed ${title ? 'mt-1' : ''} ${tone === 'info' ? 'text-inkSoft' : ''}`}>
            {children}
          </div>
        ) : null}
        {actions ? <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
};

export const Spinner = ({ label = 'Loading', size = 15, className = '' }) => (
  <span role="status" className={`inline-flex items-center gap-2 text-xs font-medium text-muted ${className}`}>
    <Loader2 size={size} className="animate-spin text-accent" aria-hidden="true" />
    <span>{label}</span>
  </span>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} aria-hidden="true" />
);

export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-lineStrong/80 bg-surface/70 px-6 py-14 text-center ${className}`}
  >
    {Icon ? (
      <span className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent-line/60">
        <Icon size={22} aria-hidden="true" />
      </span>
    ) : null}
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {description ? <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

/* -------------------------------------------------- Progress -------------------------------------------------- */
export const ProgressBar = ({ value, max = 100, className = '', tone = 'accent', label }) => {
  const pct = Math.max(0, Math.min(100, Math.round((value / (max || 1)) * 100)));
  const barTone =
    tone === 'accent'
      ? 'bg-accent'
      : tone === 'success'
        ? 'bg-success'
        : tone === 'warning'
          ? 'bg-warning'
          : 'bg-danger';

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
          <span>{label}</span>
          <span className="font-mono text-xs text-ink">{value}/{max}</span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-line/50"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barTone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const ScoreRing = ({ score, size = 132, label = 'Overall score' }) => {
  const strokeWidth = 8;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const tone = score >= 85 ? '#059669' : score >= 70 ? '#4f46e5' : score >= 55 ? '#d97706' : '#dc2626';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${score} out of 100`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight tabular-nums text-ink">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">of 100</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------- Misc -------------------------------------------------- */
export const Switch = ({ checked, onChange, label, description, id }) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={inputId} className="cursor-pointer text-sm font-medium text-ink">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
          checked ? 'bg-accent' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-out ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export const Tabs = ({ tabs, active, onChange, className = '', ariaLabel = 'Sections' }) => (
  <div className={`flex flex-wrap gap-1 border-b border-line ${className}`} role="tablist" aria-label={ariaLabel}>
    {tabs.map((tab) => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
            isActive
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:border-lineStrong hover:text-ink'
          }`}
        >
          {tab.icon ? <tab.icon size={14} aria-hidden="true" /> : null}
          <span>{tab.label}</span>
          {tab.count !== undefined ? (
            <span
              className={`rounded-full px-1.5 py-0.2 font-mono text-2xs ${
                isActive ? 'bg-accent-soft text-accent' : 'bg-canvasAlt text-muted'
              }`}
            >
              {tab.count}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);
