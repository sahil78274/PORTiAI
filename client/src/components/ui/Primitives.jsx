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
        {!required ? <span className="text-2xs font-normal lowercase tracking-normal text-faint">optional</span> : null}
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
    container: 'bg-accent-soft text-ink',
    icon: Info,
    iconColor: 'text-accent-hover',
  },
  success: {
    container: 'bg-successSoft text-success',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  warning: {
    container: 'bg-canvas text-warning',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  error: {
    container: 'bg-dangerSoft text-danger',
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
      className={`flex items-start gap-3 rounded-tile p-4 text-sm shadow-neu-inset-sm ${style.container} ${className}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-surface shadow-neu-xs ${style.iconColor}`}>
        <Icon size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="pt-1 font-semibold leading-snug">{title}</p> : null}
        {children ? (
          <div className={`leading-relaxed ${title ? 'mt-1' : 'pt-1'} ${tone === 'info' || tone === 'warning' ? 'text-inkSoft' : ''}`}>
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
    <Loader2 size={size} className="animate-spin text-accent-hover" aria-hidden="true" />
    <span>{label}</span>
  </span>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-card bg-canvas px-6 py-14 text-center shadow-neu-inset ${className}`}
  >
    {Icon ? (
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-surface text-accent-hover shadow-neu">
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
        className="h-2.5 w-full overflow-hidden rounded-full bg-canvas p-[2px] shadow-neu-inset-sm"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={`h-full rounded-full transition-colors duration-500 ease-out ${barTone}`}
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
  const tone = score >= 85 ? '#0f9466' : score >= 70 ? '#635bff' : score >= 55 ? '#d18a12' : '#d6434a';

  return (
    <div className="relative inline-flex items-center justify-center rounded-full bg-surface shadow-neu" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${score} out of 100`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#d7ddee" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-colors duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-canvas shadow-neu-inset-sm">
        <span className="text-[28px] font-semibold tabular-nums tracking-tight text-ink">{score}</span>
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
        className={`relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full shadow-neu-inset-sm transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-canvas'
        }`}
      >
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-surfaceHigh shadow-neu-xs transition-[left] duration-200 ease-out ${
            checked ? 'left-[23px]' : 'left-[3px]'
          }`}
        />
      </button>
    </div>
  );
};

export const Tabs = ({ tabs, active, onChange, className = '', ariaLabel = 'Sections' }) => (
  <div className={`segmented flex max-w-full flex-wrap ${className}`} role="tablist" aria-label={ariaLabel}>
    {tabs.map((tab) => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`segmented-item px-3.5 py-2 text-[13px] ${isActive ? 'segmented-item-active font-semibold' : ''}`}
        >
          {tab.icon ? <tab.icon size={14} aria-hidden="true" /> : null}
          <span>{tab.label}</span>
          {tab.count !== undefined ? (
            <span
              className={`rounded-full px-1.5 font-mono text-2xs ${
                isActive ? 'bg-accent-soft text-accent-hover' : 'bg-canvas text-muted shadow-neu-inset-xs'
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
