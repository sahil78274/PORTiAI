import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Webhook,
} from 'lucide-react';
import { PageHeader, StatCard } from '../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../components/ui/Primitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminService } from '../services/adminService.js';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: Activity },
  { id: 'subscriptions', label: 'Subscriptions', Icon: Users },
  { id: 'payments', label: 'Payments', Icon: CreditCard },
  { id: 'ai', label: 'AI usage', Icon: Sparkles },
  { id: 'webhooks', label: 'Webhooks', Icon: Webhook },
];

const money = (minor, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      (Number(minor) || 0) / 100
    );
  } catch {
    return `₹${Math.round((Number(minor) || 0) / 100)}`;
  }
};

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const shortId = (value) => (value ? `${String(value).slice(0, 10)}…` : '—');

const STATUS_TONE = {
  active: 'border-successLine bg-successSoft text-success',
  captured: 'border-successLine bg-successSoft text-success',
  success: 'border-successLine bg-successSoft text-success',
  processed: 'border-successLine bg-successSoft text-success',
  pending: 'border-warningLine bg-warningSoft text-warning',
  cancelled: 'border-warningLine bg-warningSoft text-warning',
  failed: 'border-dangerLine bg-dangerSoft text-danger',
  expired: 'border-lineStrong bg-canvasAlt text-muted',
  ignored: 'border-lineStrong bg-canvasAlt text-muted',
  duplicate: 'border-lineStrong bg-canvasAlt text-muted',
  created: 'border-lineStrong bg-canvasAlt text-muted',
};

const Badge = ({ value }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
      STATUS_TONE[value] || 'border-lineStrong bg-canvasAlt text-muted'
    }`}
  >
    {value || 'unknown'}
  </span>
);

const TableWrap = ({ children }) => (
  <div className="overflow-x-auto rounded-xl border border-line bg-surface">{children}</div>
);

const Th = ({ children, className = '' }) => (
  <th scope="col" className={`whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint ${className}`}>
    {children}
  </th>
);

const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-2.5 align-top text-[12px] text-inkSoft ${className}`}>{children}</td>
);

const Pager = ({ page, pages, total, onPage }) =>
  pages > 1 ? (
    <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[11.5px] text-muted">
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
    <div className="border-t border-line px-4 py-2.5 text-[11px] text-faint">{total} record{total === 1 ? '' : 's'}</div>
  );

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: 'all', interval: 'all', kind: 'all' });

  const isAdmin = Boolean(user?.isAdmin);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await adminService.summary());
    } catch (err) {
      setError(err.message || 'Admin reporting could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'subscriptions') {
        setData(
          await adminService.subscriptions({
            page,
            limit: 25,
            status: filters.status,
            interval: filters.interval,
          })
        );
      } else if (tab === 'payments') {
        setData(await adminService.payments({ page, limit: 25, status: filters.status, kind: filters.kind }));
      } else if (tab === 'ai') {
        setData(await adminService.aiUsage({ page, limit: 25 }));
      } else if (tab === 'webhooks') {
        setData(await adminService.webhooks({ page, limit: 25 }));
      } else {
        setData(null);
        await loadSummary();
      }
    } catch (err) {
      setError(err.message || 'This report could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [tab, page, filters, loadSummary]);

  useEffect(() => {
    if (!isAdmin) return;
    loadTab();
  }, [isAdmin, loadTab]);

  useEffect(() => {
    setPage(1);
  }, [tab, filters.status, filters.interval, filters.kind]);

  const rows = useMemo(() => {
    if (!data) return [];
    if (tab === 'subscriptions') return data.subscriptions || [];
    if (tab === 'payments') return data.payments || [];
    if (tab === 'ai') return data.generations || [];
    if (tab === 'webhooks') return data.events || [];
    return [];
  }, [data, tab]);

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Checking access…" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-canvasAlt text-muted">
          <Lock size={18} aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-ink">Admins only</h1>
        <p className="mt-1.5 text-[13px] leading-6 text-muted">
          Subscription and AI usage reporting is restricted to administrator accounts. If you need access, ask the
          operator to add your email to <code className="font-mono text-[11.5px]">ADMIN_EMAILS</code>.
        </p>
        <Link to="/dashboard" className="btn-secondary mt-4">
          <ArrowLeft size={13} aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const subs = summary?.subscriptions;
  const revenue = summary?.revenue;
  const ai = summary?.ai;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Admin dashboard"
        description="Premium subscriptions, payments, AI usage and webhook health. Read-only; no payment secrets are shown."
        actions={
          <Button variant="secondary" size="sm" onClick={loadTab} loading={loading}>
            <RefreshCcw size={13} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <div className="flex items-center gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[12px] font-medium transition-colors ${
              tab === id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <Alert tone="error" title="Report unavailable">
          {error}
        </Alert>
      ) : null}

      {loading && !summary && tab === 'overview' ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label="Loading reporting…" />
        </div>
      ) : null}

      {/* --------------------------------------------------------- Overview */}
      {tab === 'overview' && summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Premium subscribers"
              value={summary.users.premium}
              hint={`${summary.users.conversionPercent}% of ${summary.users.total} accounts`}
              tone="emerald"
            />
            <StatCard
              icon={CreditCard}
              label="Active subscriptions"
              value={subs.active}
              hint={`${subs.monthly} monthly · ${subs.yearly} yearly`}
            />
            <StatCard
              icon={TrendingUp}
              label="Subscription revenue"
              value={money(revenue.total, revenue.currency)}
              hint={`${money(revenue.thisMonth, revenue.currency)} this month`}
              tone="violet"
            />
            <StatCard
              icon={Sparkles}
              label="AI credits spent"
              value={ai.creditsSpent}
              hint={`${ai.generations} generations · ${ai.failedGenerations} failed`}
              tone="amber"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="surface-card p-4">
              <h2 className="text-[13px] font-semibold text-ink">Subscription status</h2>
              <dl className="mt-3 divide-y divide-line">
                {[
                  ['Active', subs.active],
                  ['Pending authorisation', subs.pending],
                  ['Failed payments', subs.failed],
                  ['Cancelled', subs.cancelled],
                  ['Expired', subs.expired],
                  ['Total records', subs.total],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 text-[12px]">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-semibold tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="surface-card p-4">
              <h2 className="text-[13px] font-semibold text-ink">Payment health</h2>
              <dl className="mt-3 divide-y divide-line">
                {[
                  ['Captured payments by kind', revenue.byKind.map((row) => `${row.kind}: ${row.count}`).join(' · ') || 'None yet'],
                  ['Revenue this month', money(revenue.thisMonth, revenue.currency)],
                  ['Failed payment records', summary.payments.failed],
                  ['AI projects saved', ai.savedProjects],
                  ['AI generations this month', ai.generationsThisMonth],
                  ['Failed webhook events', summary.webhooks.failed],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 py-2 text-[12px]">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-ink">Recent failed payments</h2>
              <button type="button" onClick={() => { setTab('payments'); setFilters((f) => ({ ...f, status: 'failed' })); }} className="text-[11.5px] font-medium text-accent-hover hover:underline">
                View all
              </button>
            </div>
            {summary.payments.recentFailed.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
                No failed payments. Renewals are healthy.
              </div>
            ) : (
              <TableWrap>
                <table className="w-full min-w-[620px] border-collapse">
                  <thead className="bg-canvasAlt">
                    <tr>
                      <Th>Date</Th>
                      <Th>Customer</Th>
                      <Th>Kind</Th>
                      <Th>Amount</Th>
                      <Th>Reason</Th>
                      <Th>Provider payment</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {summary.payments.recentFailed.map((payment) => (
                      <tr key={payment.id}>
                        <Td className="whitespace-nowrap text-muted">{dateTime(payment.createdAt)}</Td>
                        <Td>{payment.userEmail || '—'}</Td>
                        <Td className="capitalize">{payment.kind}</Td>
                        <Td className="whitespace-nowrap tabular-nums">{money(payment.amount)}</Td>
                        <Td className="max-w-[220px] text-danger">{payment.failureReason || 'Not provided'}</Td>
                        <Td className="font-mono text-[10.5px] text-faint">{shortId(payment.providerPaymentId)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </section>
        </>
      ) : null}

      {/* ---------------------------------------------------- Subscriptions */}
      {tab === 'subscriptions' ? (
        <>
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            selects={[
              { key: 'status', label: 'Status', options: ['all', 'active', 'pending', 'failed', 'cancelled', 'expired'] },
              { key: 'interval', label: 'Interval', options: ['all', 'monthly', 'yearly'] },
            ]}
          />
          {rows.length === 0 && !loading ? (
            <EmptyState icon={Users} title="No subscriptions match" description="Try a different status or interval." />
          ) : (
            <TableWrap>
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="bg-canvasAlt">
                  <tr>
                    <Th>Customer</Th>
                    <Th>Status</Th>
                    <Th>Interval</Th>
                    <Th>Amount</Th>
                    <Th>Period end</Th>
                    <Th>Intro used</Th>
                    <Th>Retries</Th>
                    <Th>Razorpay subscription</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <Td>
                        <span className="block text-[12px] font-medium text-ink">{row.userName || row.userEmail || '—'}</span>
                        <span className="block text-[10.5px] text-faint">{row.userEmail}</span>
                      </Td>
                      <Td><Badge value={row.status} /></Td>
                      <Td className="capitalize">{row.interval}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{money(row.amount, row.currency)}</Td>
                      <Td className="whitespace-nowrap">{dateTime(row.cancelAtPeriodEnd ? row.cancelEffectiveAt || row.currentPeriodEnd : row.currentPeriodEnd)}</Td>
                      <Td>{row.introOfferUsed ? 'Yes' : 'No'}</Td>
                      <Td className={row.retryCount ? 'text-warning' : ''}>{row.retryCount}</Td>
                      <Td className="font-mono text-[10.5px] text-faint" title={row.providerSubscriptionId}>
                        {shortId(row.providerSubscriptionId)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager page={data?.page || 1} pages={data?.pages || 1} total={data?.total || 0} onPage={setPage} />
            </TableWrap>
          )}
        </>
      ) : null}

      {/* --------------------------------------------------------- Payments */}
      {tab === 'payments' ? (
        <>
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            selects={[
              { key: 'status', label: 'Status', options: ['all', 'captured', 'created', 'failed', 'refunded'] },
              { key: 'kind', label: 'Kind', options: ['all', 'intro', 'monthly', 'yearly', 'renewal'] },
            ]}
          />
          {rows.length === 0 && !loading ? (
            <EmptyState icon={CreditCard} title="No payments match" description="Try a different status or type." />
          ) : (
            <TableWrap>
              <table className="w-full min-w-[960px] border-collapse">
                <thead className="bg-canvasAlt">
                  <tr>
                    <Th>Receipt</Th>
                    <Th>Customer</Th>
                    <Th>Kind</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Signature</Th>
                    <Th>Provider payment</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <Td className="whitespace-nowrap font-mono text-[10.5px] text-muted">{row.receiptNumber}</Td>
                      <Td>{row.userEmail || '—'}</Td>
                      <Td className="capitalize">{row.kind}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{money(row.amount, row.currency)}</Td>
                      <Td>
                        <Badge value={row.status} />
                        {row.failureReason ? (
                          <span className="mt-1 block max-w-[180px] text-[10.5px] leading-4 text-danger">{row.failureReason}</span>
                        ) : null}
                      </Td>
                      <Td>{row.signatureVerified ? <span className="text-success">Verified</span> : <span className="text-faint">Not verified</span>}</Td>
                      <Td className="font-mono text-[10.5px] text-faint" title={row.providerPaymentId}>
                        {shortId(row.providerPaymentId)}
                      </Td>
                      <Td className="whitespace-nowrap text-muted">{dateTime(row.paidAt || row.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager page={data?.page || 1} pages={data?.pages || 1} total={data?.total || 0} onPage={setPage} />
            </TableWrap>
          )}
        </>
      ) : null}

      {/* --------------------------------------------------------- AI usage */}
      {tab === 'ai' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={Sparkles} label="Generations" value={data?.total ?? '—'} hint="All time" tone="violet" />
            <StatCard icon={Sparkles} label="Saved projects" value={data?.projectTotal ?? '—'} hint="Ready projects in accounts" />
            <StatCard icon={AlertTriangle} label="Failed generations" value={data?.generations?.filter((row) => row.status === 'failed').length ?? 0} hint="On this page" tone="amber" />
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <TableWrap>
              <table className="w-full min-w-[720px] border-collapse">
                <thead className="bg-canvasAlt">
                  <tr>
                    <Th>Date</Th>
                    <Th>Customer</Th>
                    <Th>Kind</Th>
                    <Th>Stack</Th>
                    <Th>Credits</Th>
                    <Th>Status</Th>
                    <Th>Duration</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <Td className="whitespace-nowrap text-muted">{dateTime(row.createdAt)}</Td>
                      <Td>{row.userEmail || '—'}</Td>
                      <Td className="capitalize">{row.kind}</Td>
                      <Td>{row.stack}</Td>
                      <Td className="tabular-nums">{row.credits}</Td>
                      <Td>
                        <Badge value={row.status} />
                        {row.errorCode ? <span className="mt-1 block text-[10px] text-danger">{row.errorCode}</span> : null}
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums text-muted">{Math.round((row.durationMs || 0) / 1000)}s</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager page={data?.page || 1} pages={data?.pages || 1} total={data?.total || 0} onPage={setPage} />
            </TableWrap>

            <aside className="space-y-3">
              <div className="surface-card p-4">
                <h3 className="text-[12px] font-semibold text-ink">Top consumers this month</h3>
                {data?.topUsers?.length ? (
                  <ul className="mt-2.5 space-y-2">
                    {data.topUsers.map((row) => (
                      <li key={row.userEmail} className="text-[11.5px]">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-inkSoft">{row.userEmail || 'Unknown'}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-ink">{row.credits}</span>
                        </div>
                        <p className="text-[10px] text-faint">
                          {row.generations} generations · {row.failures} failed
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11.5px] text-muted">No generations this month.</p>
                )}
              </div>

              <div className="surface-card p-4">
                <h3 className="text-[12px] font-semibold text-ink">Latest projects</h3>
                <ul className="mt-2.5 space-y-2">
                  {(data?.projects || []).slice(0, 6).map((row) => (
                    <li key={row.id} className="text-[11.5px]">
                      <p className="truncate font-medium text-inkSoft">{row.title}</p>
                      <p className="text-[10px] text-faint">
                        {row.userEmail} · {row.stack} · {row.fileCount} files
                      </p>
                    </li>
                  ))}
                  {!data?.projects?.length ? <li className="text-[11.5px] text-muted">No projects yet.</li> : null}
                </ul>
              </div>
            </aside>
          </div>
        </>
      ) : null}

      {/* -------------------------------------------------------- Webhooks */}
      {tab === 'webhooks' ? (
        rows.length === 0 && !loading ? (
          <EmptyState
            icon={Webhook}
            title="No webhook events yet"
            description="Razorpay webhook deliveries appear here with their signature check and processing result."
          />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-canvasAlt">
                <tr>
                  <Th>Received</Th>
                  <Th>Event</Th>
                  <Th>Status</Th>
                  <Th>Signature</Th>
                  <Th>Attempts</Th>
                  <Th>Summary</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((event) => (
                  <tr key={event.id}>
                    <Td className="whitespace-nowrap text-muted">{dateTime(event.createdAt)}</Td>
                    <Td>
                      <span className="block font-mono text-[10.5px] text-inkSoft">{event.eventType}</span>
                      <span className="block text-[10px] text-faint" title={event.eventId}>{shortId(event.eventId)}</span>
                    </Td>
                    <Td><Badge value={event.status} /></Td>
                    <Td>{event.signatureValid ? <span className="text-success">Valid</span> : <span className="text-danger">Invalid</span>}</Td>
                    <Td className="tabular-nums">{event.attempts}</Td>
                    <Td className="max-w-[320px] text-[11px] leading-5 text-muted">
                      {event.error ? <span className="text-danger">{event.error}</span> : event.summary || '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={data?.page || 1} pages={data?.pages || 1} total={data?.total || 0} onPage={setPage} />
          </TableWrap>
        )
      ) : null}

      <p className="flex items-center gap-1.5 text-[10.5px] leading-5 text-faint">
        <ShieldCheck size={11} aria-hidden="true" />
        Reporting is read-only. Razorpay key secrets, webhook secrets, passwords and session tokens are never included in
        these responses.
      </p>
    </div>
  );
}

const FilterBar = ({ filters, setFilters, selects }) => (
  <div className="flex flex-wrap items-center gap-2">
    {selects.map(({ key, label, options }) => (
      <label key={key} className="flex items-center gap-1.5 text-[11px] text-muted">
        {label}
        <select
          value={filters[key]}
          onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
          className="rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] text-ink focus:border-accent-line focus:outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    ))}
  </div>
);
