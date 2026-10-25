import { forwardRef, useId } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

/* -------------------------------------------------- Button -------------------------------------------------- */
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs',
  md: '',
  lg: 'px-4 py-2 text-base',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className = '', children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

/* -------------------------------------------------- Fields -------------------------------------------------- */
export const Field = ({ label, htmlFor, hint, error, required, children, className = '' }) => (
  <div className={className}>
    {label ? (
      <label htmlFor={htmlFor} className="label">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
        {required ? null : <span className="ml-1.5 text-xs font-normal text-muted">optional</span>}
      </label>
    ) : null}
    {children}
    {error ? (
      <p className="mt-1.5 flex items-start gap-1 text-xs text-danger">
        <AlertCircle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
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
  info: 'border-accent-line bg-accent-soft text-ink',
  success: 'border-success/25 bg-successSoft text-success',
  warning: 'border-warning/25 bg-warningSoft text-warning',
  error: 'border-danger/25 bg-dangerSoft text-danger',
};

export const Alert = ({ tone = 'info', title, children, className = '', actions }) => (
  <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3.5 py-3 ${ALERT_STYLES[tone]} ${className}`}>
    {title ? <p className="text-sm font-semibold">{title}</p> : null}
    {children ? <div className={`text-sm leading-6 ${title ? 'mt-1' : ''} ${tone === 'info' ? 'text-inkSoft' : ''}`}>{children}</div> : null}
    {actions ? <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);

export const Spinner = ({ label = 'Loading', className = '' }) => (
  <span role="status" className={`inline-flex items-center gap-2 text-sm text-muted ${className}`}>
    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
    <span>{label}</span>
  </span>
);

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded bg-canvasAlt ${className}`} aria-hidden="true" />;

export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center rounded-md border border-dashed border-lineStrong bg-surface px-6 py-12 text-center ${className}`}>
    {Icon ? (
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-accent-soft text-accent">
        <Icon size={18} aria-hidden="true" />
      </span>
    ) : null}
    <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
    {description ? <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

/* -------------------------------------------------- Progress -------------------------------------------------- */
export const ProgressBar = ({ value, max = 100, className = '', tone = 'accent', label }) => {
  const pct = Math.max(0, Math.min(100, Math.round((value / (max || 1)) * 100)));
  const barTone = tone === 'accent' ? 'bg-accent' : tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-danger';
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>{label}</span>
          <span className="font-mono text-inkSoft">{value}/{max}</span>
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-sm bg-canvasAlt"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div className={`h-full ${barTone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const ScoreRing = ({ score, size = 132, label = 'Overall score' }) => {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const tone = score >= 85 ? '#1f6b4a' : score >= 70 ? '#2f4a8b' : score >= 55 ? '#8a5a10' : '#a3342e';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${score} out of 100`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eeece6" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-ink">{score}</span>
        <span className="text-2xs uppercase tracking-widest text-muted">of 100</span>
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
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
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
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-lineStrong bg-canvasAlt'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all ${
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
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:border-lineStrong hover:text-ink'
          }`}
        >
          {tab.label}
          {tab.count !== undefined ? <span className="ml-1.5 text-xs text-muted">{tab.count}</span> : null}
        </button>
      );
    })}
  </div>
);
