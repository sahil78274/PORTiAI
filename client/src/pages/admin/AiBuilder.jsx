import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Sparkles, Wand2 } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui/Primitives.jsx';
import { Badge, Breakdown, FilterBar, LineChart, Pager, TableWrap, Td, Th, dateTime } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];
const KIND_OPTIONS = [
  { value: 'all', label: 'All kinds' },
  { value: 'project', label: 'Project' },
  { value: 'files', label: 'Files' },
  { value: 'regenerate-file', label: 'Regenerate file' },
  { value: 'modify-file', label: 'Modify file' },
  { value: 'manual-save', label: 'Manual save' },
];
const STACK_OPTIONS = [
  { value: 'all', label: 'All stacks' },
  { value: 'html-css-js', label: 'HTML/CSS/JS' },
  { value: 'react', label: 'React' },
  { value: 'react-express', label: 'React + Express' },
  { value: 'mern', label: 'MERN' },
  { value: 'python', label: 'Python' },
];

export default function AiBuilder() {
  const [stats, setStats] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', kind: 'all', stack: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, generationsData, projectsData] = await Promise.all([
        adminService.aiBuilderStats(),
        adminService.generations({ page, limit: 25, search, ...filters }),
        adminService.aiProjects({ page: 1, limit: 10 }),
      ]);
      setStats(statsData);
      setGenerations(generationsData.generations);
      setPages(generationsData.pages);
      setTotal(generationsData.total);
      setProjects(projectsData.projects);
    } catch (err) {
      setError(err.message || 'AI builder data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  if (loading && !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading AI builder data…" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="AI Project Builder"
        description="Generation volume, mode usage, failures and per-user consumption. Prompts and API keys are never shown."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCcw size={13} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Alert tone="error" title="AI builder data unavailable">
          {error}
        </Alert>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Sparkles} label="Total generations" value={stats.totals.generations} hint={`${stats.totals.success} success · ${stats.totals.failed} failed`} />
            <StatCard icon={Wand2} label="Success rate" value={`${stats.totals.successRate}%`} hint={`${stats.totals.generationsThisMonth} generations this month`} tone="emerald" />
            <StatCard icon={Sparkles} label="Credits spent" value={stats.totals.creditsSpent} hint="Successful generations only" tone="violet" />
            <StatCard icon={Wand2} label="Projects saved" value={stats.projectsByStatus.ready || 0} hint={`${stats.projectsByStatus.failed || 0} failed · ${stats.projectsByStatus.generating || 0} generating`} tone="amber" />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <section className="surface-card p-4">
              <h2 className="text-[13px] font-semibold text-ink">Mode usage (projects)</h2>
              <div className="mt-2">
                <Breakdown
                  rows={[
                    ['Starter', stats.projectsByComplexity.starter || 0],
                    ['Standard', stats.projectsByComplexity.standard || 0],
                    ['Advanced', stats.projectsByComplexity.advanced || 0],
                  ]}
                />
              </div>
            </section>
            <section className="surface-card p-4">
              <h2 className="text-[13px] font-semibold text-ink">Generations by kind</h2>
              <div className="mt-2">
                <Breakdown rows={Object.entries(stats.generationsByKind).map(([kind, count]) => [kind, count])} />
              </div>
            </section>
            <section className="surface-card p-4">
              <h2 className="text-[13px] font-semibold text-ink">Failure categories</h2>
              {stats.errorBreakdown.length === 0 ? (
                <p className="mt-2 text-[12px] text-muted">No failed generations recorded.</p>
              ) : (
                <div className="mt-2">
                  <Breakdown rows={stats.errorBreakdown.map((row) => [row.errorCode, row.count])} />
                </div>
              )}
            </section>
          </div>

          <section className="surface-card p-4">
            <h2 className="text-[13px] font-semibold text-ink">Generations per day</h2>
            <p className="mt-0.5 text-[11.5px] text-muted">Last 14 days. Token usage and API cost are not recorded by the pipeline and are not estimated.</p>
            <div className="mt-3">
              <LineChart data={stats.dailySeries.map((row) => ({ date: row.date, label: row.date.slice(5), value: row.generations }))} />
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-ink">Top users by generations</h2>
            {stats.topUsers.length === 0 ? (
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
                      <Th>Success</Th>
                      <Th>Failed</Th>
                      <Th>Credits</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {stats.topUsers.map((row) => (
                      <tr key={row.userId}>
                        <Td>{row.userEmail || '—'}</Td>
                        <Td className="tabular-nums">{row.generations}</Td>
                        <Td className="tabular-nums">{row.success}</Td>
                        <Td className="tabular-nums">{row.failed}</Td>
                        <Td className="tabular-nums">{row.credits}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </section>
        </>
      ) : null}

      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-ink">Recent projects</h2>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
            No AI projects generated yet.
          </div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-canvasAlt">
                <tr>
                  <Th>Project</Th>
                  <Th>User</Th>
                  <Th>Stack</Th>
                  <Th>Mode</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <Td className="font-medium text-ink">{project.title}</Td>
                    <Td>{project.userEmail || '—'}</Td>
                    <Td className="capitalize">{project.stack}</Td>
                    <Td className="capitalize">{project.complexity}</Td>
                    <Td>
                      <Badge value={project.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{dateTime(project.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold text-ink">Generation history</h2>
        <FilterBar
          search={search}
          onSearch={setSearch}
          selects={[
            { key: 'status', label: 'Status', options: STATUS_OPTIONS },
            { key: 'kind', label: 'Kind', options: KIND_OPTIONS },
            { key: 'stack', label: 'Stack', options: STACK_OPTIONS },
          ]}
          onChange={{ values: filters, set: setFilter }}
        />
        {generations.length === 0 && !loading ? (
          <EmptyState icon={Sparkles} title="No generations match" description="Try a different search or filter." />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-canvasAlt">
                <tr>
                  <Th>User</Th>
                  <Th>Kind</Th>
                  <Th>Provider / model</Th>
                  <Th>Stack</Th>
                  <Th>Status</Th>
                  <Th>Error</Th>
                  <Th>Duration</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {generations.map((row) => (
                  <tr key={row.id}>
                    <Td>{row.userEmail || '—'}</Td>
                    <Td className="capitalize">{row.kind}</Td>
                    <Td className="text-[11px] text-muted">
                      {row.provider || '—'} · {row.model || '—'}
                    </Td>
                    <Td className="capitalize">{row.stack || '—'}</Td>
                    <Td>
                      <Badge value={row.status} />
                    </Td>
                    <Td className="font-mono text-[10.5px] text-danger">{row.errorCode || '—'}</Td>
                    <Td className="tabular-nums">{row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s` : '—'}</Td>
                    <Td className="whitespace-nowrap text-muted">{dateTime(row.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
              <Pager page={page} pages={pages} total={total} onPage={setPage} />
            </table>
          </TableWrap>
        )}
      </section>
    </div>
  );
}
