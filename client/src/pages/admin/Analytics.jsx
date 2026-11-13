import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, RefreshCcw, Sparkles } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/ui/Kit.jsx';
import { Alert, Button, Spinner } from '../../components/ui/Primitives.jsx';
import { BarChart, LineChart, TableWrap, Td, Th } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.analytics());
    } catch (err) {
      setError(err.message || 'Analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading analytics…" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Administration" title="AI Usage & Analytics" />
        <Alert tone="error" title="Analytics unavailable">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="AI Usage & Analytics"
        description="Portfolio analyzer and AI Project Builder usage from real counters and generation records."
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
        <StatCard icon={Activity} label="Analyzer requests" value={data.analyzer.totalRequests} hint={`${data.analyzer.activeUsers} users · ${data.analyzer.analysesStored} analyses stored`} />
        <StatCard icon={Sparkles} label="Project generations" value={data.projectBuilder.totalGenerations} hint={`${data.projectBuilder.generationsThisMonth} this month`} tone="violet" />
        <StatCard icon={BarChart3} label="Success rate" value={`${data.projectBuilder.successRate}%`} hint={`${data.projectBuilder.success} success · ${data.projectBuilder.failed} failed`} tone="emerald" />
        <StatCard icon={Activity} label="Total AI API requests" value={data.apiRequests.total} hint={`${data.apiRequests.analyzer} analyzer · ${data.apiRequests.projectBuilder} builder`} tone="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="surface-card p-4">
          <h2 className="text-[13px] font-semibold text-ink">Daily usage (last 14 days)</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Analyzer requests and project generations per day.</p>
          <div className="mt-3">
            <LineChart data={data.dailySeries.map((row) => ({ date: row.date, label: row.date.slice(5), value: row.generations + row.analyzerRequests }))} />
          </div>
        </section>
        <section className="surface-card p-4">
          <h2 className="text-[13px] font-semibold text-ink">Monthly generations</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">AI Project Builder generations per month (last 6 months).</p>
          <div className="mt-3">
            <BarChart data={data.monthlySeries.map((row) => ({ month: row.month, label: row.label, value: row.generations }))} />
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-ink">Top users by generations</h2>
        {data.topUsers.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
            No generation activity yet.
          </div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[560px] border-collapse">
              <thead className="bg-canvasAlt">
                <tr>
                  <Th>User</Th>
                  <Th>Generations</Th>
                  <Th>Credits</Th>
                  <Th>Failures</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.topUsers.map((row) => (
                  <tr key={row.userEmail}>
                    <Td>{row.userEmail || '—'}</Td>
                    <Td className="tabular-nums">{row.generations}</Td>
                    <Td className="tabular-nums">{row.credits}</Td>
                    <Td className="tabular-nums">{row.failures}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>

      <Alert tone="info" title="Token usage and cost">
        Token counts and estimated API costs are not recorded by the AI pipeline, so they are not shown here rather
        than invented. Request counts come from the daily per-user AI budget counter (analyzer) and the generation
        audit records (Project Builder).
      </Alert>
    </div>
  );
}
