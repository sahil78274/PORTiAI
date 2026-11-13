import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CreditCard,
  FolderOpen,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Users,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { PageHeader, StatCard } from '../../components/ui/Kit.jsx';
import { Alert, Button, Spinner } from '../../components/ui/Primitives.jsx';
import { BarChart, Breakdown, LineChart, TableWrap, Td, Th, dateTime, money, moneyMajor } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await adminService.summary());
    } catch (err) {
      setError(err.message || 'The overview could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading overview…" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Administration" title="Overview" />
        <Alert tone="error" title="Overview unavailable">
          {error}
        </Alert>
      </div>
    );
  }

  const users = summary.users;
  const revenue = summary.revenue;
  const payments = summary.payments;
  const ai = summary.ai;
  const portfolios = summary.portfolios;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Overview"
        description="Live data from the database — users, portfolios, subscriptions, payments and AI usage."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCcw size={13} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Alert tone="error" title="Refresh failed">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={users.total} hint={`${users.newThisMonth} new this month`} to="/admin/users" />
        <StatCard icon={UserCheck} label="Active users" value={users.active} hint={`${users.suspended} suspended`} tone="emerald" to="/admin/users" />
        <StatCard icon={Sparkles} label="Premium users" value={users.premium} hint={`${users.conversionPercent}% conversion · ${users.free} free`} tone="violet" to="/admin/subscriptions" />
        <StatCard icon={FolderOpen} label="Portfolios" value={portfolios.total} hint={`${portfolios.published} published · ${portfolios.drafts} drafts`} to="/admin/portfolios" />
        <StatCard icon={Activity} label="AI projects generated" value={ai.savedProjects} hint={`${ai.generations} generations · ${ai.failedGenerations} failed`} tone="amber" to="/admin/ai-builder" />
        <StatCard icon={CreditCard} label="Successful payments" value={payments.successful} hint={`${payments.failed} failed · ${payments.total} total`} tone="emerald" to="/admin/payments" />
        <StatCard icon={TrendingUp} label="Total revenue" value={money(revenue.total, revenue.currency)} hint={`${money(revenue.thisMonth, revenue.currency)} this month`} tone="violet" to="/admin/payments" />
        <StatCard icon={XCircle} label="Failed payments" value={payments.failed} hint="See payment health below" tone="amber" to="/admin/payments" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="surface-card p-4">
          <h2 className="text-[13px] font-semibold text-ink">Monthly user registrations</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">New accounts per month (last 6 months).</p>
          <div className="mt-3">
            <BarChart data={summary.charts.registrationsByMonth} />
          </div>
        </section>
        <section className="surface-card p-4">
          <h2 className="text-[13px] font-semibold text-ink">Monthly revenue</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Captured payments per month (last 6 months).</p>
          <div className="mt-3">
            <LineChart data={summary.charts.revenueByMonth} format={(value) => moneyMajor(value, revenue.currency)} />
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="surface-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Subscription status</h2>
            <Link to="/admin/subscriptions" className="text-[11.5px] font-medium text-accent-hover hover:underline">
              Manage
            </Link>
          </div>
          <div className="mt-2">
            <Breakdown
              rows={[
                ['Active', summary.subscriptions.active],
                ['Pending authorisation', summary.subscriptions.pending],
                ['Failed', summary.subscriptions.failed],
                ['Cancelled', summary.subscriptions.cancelled],
                ['Expired', summary.subscriptions.expired],
                ['Total records', summary.subscriptions.total],
              ]}
            />
          </div>
        </section>

        <section className="surface-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Payment health</h2>
            <Link to="/admin/payments" className="text-[11.5px] font-medium text-accent-hover hover:underline">
              View payments
            </Link>
          </div>
          <div className="mt-2">
            <Breakdown
              rows={[
                ['Captured by kind', revenue.byKind.map((row) => `${row.kind}: ${row.count}`).join(' · ') || 'None yet'],
                ['Revenue this month', money(revenue.thisMonth, revenue.currency)],
                ['Failed payment records', payments.failed],
                ['AI projects saved', ai.savedProjects],
                ['AI generations this month', ai.generationsThisMonth],
                ['Failed webhook events', summary.webhooks.failed],
              ]}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Recent registrations</h2>
            <Link to="/admin/users" className="text-[11.5px] font-medium text-accent-hover hover:underline">
              All users
            </Link>
          </div>
          {summary.recentRegistrations.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
              No registrations yet.
            </div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[460px] border-collapse">
                <thead className="bg-canvasAlt">
                  <tr>
                    <Th>User</Th>
                    <Th>Plan</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {summary.recentRegistrations.map((user) => (
                    <tr key={user.id}>
                      <Td>
                        <span className="block font-medium text-ink">{user.name}</span>
                        <span className="block text-[11px] text-faint">{user.email}</span>
                      </Td>
                      <Td className="capitalize">{user.plan}</Td>
                      <Td className="whitespace-nowrap text-muted">{dateTime(user.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink">Recent payments</h2>
            <Link to="/admin/payments" className="text-[11.5px] font-medium text-accent-hover hover:underline">
              All payments
            </Link>
          </div>
          {summary.recentPayments.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
              No captured payments yet.
            </div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[460px] border-collapse">
                <thead className="bg-canvasAlt">
                  <tr>
                    <Th>Customer</Th>
                    <Th>Amount</Th>
                    <Th>Paid</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {summary.recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <Td>{payment.userEmail || '—'}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{money(payment.amount)}</Td>
                      <Td className="whitespace-nowrap text-muted">{dateTime(payment.paidAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </section>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-ink">Recent admin activity</h2>
          <Link to="/admin/settings" className="text-[11.5px] font-medium text-accent-hover hover:underline">
            Audit log
          </Link>
        </div>
        {summary.recentActivities.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
            No admin actions recorded yet.
          </div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[460px] border-collapse">
              <thead className="bg-canvasAlt">
                <tr>
                  <Th>Action</Th>
                  <Th>Admin</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {summary.recentActivities.map((entry) => (
                  <tr key={entry.id}>
                    <Td className="font-mono text-[11px]">{entry.action}</Td>
                    <Td>{entry.adminEmail}</Td>
                    <Td className="whitespace-nowrap text-muted">{dateTime(entry.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>
    </div>
  );
}
