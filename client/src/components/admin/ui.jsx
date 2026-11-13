import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button, Select, TextInput } from '../ui/Primitives.jsx';

/* -------------------------------------------------- Formatting -------------------------------------------------- */

export const money = (minor, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      (Number(minor) || 0) / 100
    );
  } catch {
    return `₹${Math.round((Number(minor) || 0) / 100)}`;
  }
};

export const moneyMajor = (major, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(major) || 0);
  } catch {
    return `₹${Math.round(Number(major) || 0)}`;
  }
};

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const dateOnly = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

export const shortId = (value) => (value ? `${String(value).slice(0, 10)}…` : '—');

/* -------------------------------------------------- Badge -------------------------------------------------- */

const STATUS_TONE = {
  active: 'border-successLine bg-successSoft text-success',
  captured: 'border-successLine bg-successSoft text-success',
  success: 'border-successLine bg-successSoft text-success',
  processed: 'border-successLine bg-successSoft text-success',
  published: 'border-successLine bg-successSoft text-success',
  ready: 'border-successLine bg-successSoft text-success',
  premium: 'border-accent-line bg-accent-soft text-accent-hover',
  enabled: 'border-successLine bg-successSoft text-success',
  pending: 'border-warningLine bg-warningSoft text-warning',
  cancelled: 'border-warningLine bg-warningSoft text-warning',
  suspended: 'border-dangerLine bg-dangerSoft text-danger',
  failed: 'border-dangerLine bg-dangerSoft text-danger',
  generating: 'border-warningLine bg-warningSoft text-warning',
  disabled: 'border-lineStrong bg-canvasAlt text-muted',
  draft: 'border-lineStrong bg-canvasAlt text-muted',
  expired: 'border-lineStrong bg-canvasAlt text-muted',
  ignored: 'border-lineStrong bg-canvasAlt text-muted',
  duplicate: 'border-lineStrong bg-canvasAlt text-muted',
  created: 'border-lineStrong bg-canvasAlt text-muted',
  free: 'border-lineStrong bg-canvasAlt text-muted',
  admin: 'border-accent-line bg-accent-soft text-accent-hover',
};

export const Badge = ({ value }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
      STATUS_TONE[value] || 'border-lineStrong bg-canvasAlt text-muted'
    }`}
  >
    {value || 'unknown'}
  </span>
);

/* -------------------------------------------------- Table -------------------------------------------------- */

export const TableWrap = ({ children }) => (
  <div className="overflow-x-auto rounded-xl border border-line bg-surface">{children}</div>
);

export const Th = ({ children, className = '' }) => (
  <th scope="col" className={`whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-2.5 align-top text-[12px] text-inkSoft ${className}`}>{children}</td>
);

export const Pager = ({ page, pages, total, onPage }) => (
  <tfoot>
    <tr>
      <td colSpan={12} className="border-t border-line px-4 py-2.5">
        {pages > 1 ? (
          <div className="flex items-center justify-between gap-3 text-[11.5px] text-muted">
            <span>
              Page {page} of {pages} · {total} records
            </span>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                <ChevronLeft size={12} aria-hidden="true" />
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
                Next
                <ChevronRight size={12} aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-faint">
            {total} record{total === 1 ? '' : 's'}
          </p>
        )}
      </td>
    </tr>
  </tfoot>
);

/* -------------------------------------------------- Filter bar -------------------------------------------------- */

export const FilterBar = ({ search, onSearch, selects = [], onChange }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    {onSearch ? (
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
        <TextInput
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search…"
          aria-label="Search"
          className="h-8 py-1 pl-8 text-[12px]"
        />
      </div>
    ) : null}
    <div className="flex flex-wrap items-center gap-2">
      {selects.map(({ key, label, options }) => (
        <label key={key} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
          <span className="sr-only">{label}</span>
          <Select
            aria-label={label}
            className="h-8 py-1 text-[12px]"
            value={onChange.values[key]}
            onChange={(event) => onChange.set(key, event.target.value)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {label}: {option.label}
              </option>
            ))}
          </Select>
        </label>
      ))}
    </div>
  </div>
);

/* -------------------------------------------------- Charts (dependency-free SVG) -------------------------------------------------- */

export const BarChart = ({ data, height = 140, format = (value) => value }) => {
  const max = Math.max(1, ...data.map((row) => Number(row.value) || 0));
  const width = 560;
  const barWidth = Math.max(8, (width / Math.max(1, data.length)) * 0.55);
  const step = width / Math.max(1, data.length);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[420px] w-full" role="img" aria-label="Bar chart">
        {data.map((row, index) => {
          const value = Number(row.value) || 0;
          const barHeight = Math.max(2, (value / max) * (height - 34));
          const x = index * step + (step - barWidth) / 2;
          const y = height - 22 - barHeight;
          return (
            <g key={row.month || row.date || index}>
              <title>{`${row.label || row.date || ''}: ${format(value)}`}</title>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill="var(--accent)" opacity={value === 0 ? 0.25 : 0.85} />
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--faint)">
                {row.label || row.date || ''}
              </text>
              {value > 0 ? (
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--ink)">
                  {format(value)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const LineChart = ({ data, height = 140, format = (value) => value }) => {
  const width = 560;
  const max = Math.max(1, ...data.map((row) => Number(row.value) || 0));
  const points = data.map((row, index) => {
    const x = data.length <= 1 ? width / 2 : (index / (data.length - 1)) * (width - 16) + 8;
    const y = height - 22 - ((Number(row.value) || 0) / max) * (height - 40);
    return { x, y, row };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[420px] w-full" role="img" aria-label="Line chart">
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={index}>
            <title>{`${point.row.label || point.row.date || ''}: ${format(Number(point.row.value) || 0)}`}</title>
            <circle cx={point.x} cy={point.y} r="3" fill="var(--accent)" />
            <text x={point.x} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--faint)">
              {point.row.label || point.row.date || ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/** Horizontal breakdown rows (counts by category). */
export const Breakdown = ({ rows }) => (
  <dl className="divide-y divide-line">
    {rows.map(([label, value]) => (
      <div key={label} className="flex items-center justify-between gap-3 py-2 text-[12px]">
        <dt className="capitalize text-muted">{label}</dt>
        <dd className="font-semibold tabular-nums text-ink">{value}</dd>
      </div>
    ))}
  </dl>
);
