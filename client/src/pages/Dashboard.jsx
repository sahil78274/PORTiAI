import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Eye,
  Copy,
  Trash2,
  LayoutTemplate,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Gauge,
  Globe,
  FileText,
} from 'lucide-react';
import { Button, EmptyState, Spinner } from '../components/ui/Primitives.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Modal from '../components/ui/Modal.jsx';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../components/marketing/TemplatePreviewFrame.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { formatDate, formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

const SORT_OPTIONS = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Recently created' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'status', label: 'Published first' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
];

export default function Dashboard() {
  const { user, stats, setStats, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [portfolios, setPortfolios] = useState([]);
  const [serverStats, setServerStats] = useState(stats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('updated');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewPortfolio, setPreviewPortfolio] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const searchRef = useRef(null);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      setError('');
      try {
        const data = await portfolioService.list({ search: debouncedSearch, status, sort });
        setPortfolios(data.portfolios);
        setServerStats(data.stats);
        setStats(data.stats);
      } catch (err) {
        setError(err.message || 'Could not load your portfolios.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, status, sort, setStats]
  );

  // Reload whenever the debounced search term, status filter or sort changes.
  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({ total: serverStats?.total ?? 0, published: serverStats?.published ?? 0, drafts: serverStats?.drafts ?? 0 }),
    [serverStats]
  );

  const openPreview = async (portfolio) => {
    setPreviewTarget(portfolio);
    setPreviewLoading(true);
    setPreviewPortfolio(null);
    try {
      const data = await portfolioService.get(portfolio.id);
      setPreviewPortfolio(data.portfolio);
    } catch (err) {
      toast.error(err.message || 'Could not load the preview.');
      setPreviewTarget(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const copyLink = async (portfolio) => {
    const url = `${window.location.origin}/p/${portfolio.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public link copied.');
    } catch {
      toast.info('Copy failed in this browser. The link is:', { description: url, duration: 9000 });
    }
  };

  const onDuplicate = async (portfolio) => {
    setBusyId(portfolio.id);
    try {
      const data = await portfolioService.duplicate(portfolio.id);
      toast.success(`Duplicated as “${data.portfolio.title}”.`);
      await load({ quiet: true });
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not duplicate this portfolio.');
    } finally {
      setBusyId(null);
    }
  };

  const onTogglePublish = async (portfolio) => {
    setBusyId(portfolio.id);
    try {
      const data = await portfolioService.setPublished(portfolio.id, !portfolio.published);
      toast.success(data.portfolio.published ? 'Portfolio published.' : 'Portfolio set back to draft.');
      await load({ quiet: true });
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not change the publishing state.');
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await portfolioService.remove(deleteTarget.id);
      toast.success('Portfolio deleted.');
      setDeleteTarget(null);
      await load({ quiet: true });
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not delete this portfolio.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {counts.total === 0
              ? 'Create your first portfolio to get started.'
              : `You have ${counts.total} portfolio${counts.total === 1 ? '' : 's'} — ${counts.published} published, ${counts.drafts} draft${counts.drafts === 1 ? '' : 's'}.`}
          </p>
        </div>
        <Link to="/dashboard/create" className="btn-primary">
          <Plus size={15} aria-hidden="true" /> Create new portfolio
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Portfolios', value: counts.total, icon: FolderOpen },
          { label: 'Published', value: counts.published, icon: Globe },
          { label: 'Drafts', value: counts.drafts, icon: FileText },
        ].map((card) => (
          <div key={card.label} className="card flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-2xs uppercase tracking-[0.14em] text-muted">{card.label}</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{card.value}</p>
            </div>
            <card.icon size={18} className="text-lineStrong" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              aria-pressed={status === filter.id}
              className={`rounded px-2.5 py-1.5 text-sm transition-colors ${
                status === filter.id ? 'bg-canvasAlt font-medium text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search portfolios"
              aria-label="Search portfolios by title or name"
              className="input w-full pl-8 sm:w-56"
            />
          </div>
          <label htmlFor="sort" className="sr-only">
            Sort portfolios
          </label>
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)} className="select w-full sm:w-44">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => load()} aria-label="Refresh list">
            <RefreshCw size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="card h-[74px] animate-pulse bg-canvasAlt/40" />
            ))}
            <div className="pt-1">
              <Spinner label="Loading your portfolios…" />
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="card border-danger/25 bg-dangerSoft p-5">
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={() => load()}>
              Try again
            </Button>
          </div>
        ) : portfolios.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={search || status !== 'all' ? 'No portfolios match this filter' : 'No portfolios yet'}
            description={
              search || status !== 'all'
                ? 'Adjust the search term or status filter to see more results.'
                : 'The wizard walks you through your profile, skills, projects and design choices. It takes about ten minutes for a first draft.'
            }
            action={
              search || status !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link to="/dashboard/create" className="btn-primary">
                  <Plus size={15} aria-hidden="true" /> Create new portfolio
                </Link>
              )
            }
          />
        ) : (
          <ul className="space-y-2">
            {portfolios.map((portfolio) => (
              <li key={portfolio.id} className="card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="mt-0.5 h-9 w-9 shrink-0 rounded border border-line"
                      style={{ background: `${portfolio.accent || '#2f4a8b'}14` }}
                      aria-hidden="true"
                    >
                      <span className="flex h-full w-full items-center justify-center">
                        <LayoutTemplate size={15} style={{ color: portfolio.accent || '#2f4a8b' }} />
                      </span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/dashboard/portfolio/${portfolio.id}/edit`}
                          className="truncate text-[15px] font-medium text-ink hover:underline hover:underline-offset-4"
                        >
                          {portfolio.title}
                        </Link>
                        <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
                          {portfolio.published ? 'Published' : 'Draft'}
                        </span>
                        {portfolio.analysisScore !== null ? (
                          <span className="badge border-lineStrong bg-surface text-inkSoft" title={`Last analysis: ${portfolio.analysisSource}`}>
                            <Gauge size={10} aria-hidden="true" /> {portfolio.analysisScore}/100
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {getTemplate(portfolio.templateId).name}
                        {portfolio.fullName ? ` · ${portfolio.fullName}` : ''}
                        {portfolio.projectCount ? ` · ${portfolio.projectCount} project${portfolio.projectCount === 1 ? '' : 's'}` : ''}
                        {' · updated '}
                        <span title={formatDate(portfolio.updatedAt)}>{formatRelative(portfolio.updatedAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {portfolio.published && portfolio.slug ? (
                      <>
                        <a
                          href={`/p/${portfolio.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost px-2 py-1 text-xs"
                        >
                          <ExternalLink size={13} aria-hidden="true" /> Open
                        </a>
                        <Button variant="ghost" size="sm" onClick={() => copyLink(portfolio)}>
                          <Copy size={13} aria-hidden="true" /> Copy link
                        </Button>
                      </>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => openPreview(portfolio)}>
                      <Eye size={13} aria-hidden="true" /> Preview
                    </Button>
                    <Link to={`/dashboard/portfolio/${portfolio.id}/analyze`} className="btn-ghost px-2.5 py-1 text-xs">
                      <Gauge size={13} aria-hidden="true" /> Analyze
                    </Link>
                    <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-ghost px-2.5 py-1 text-xs">
                      <Pencil size={13} aria-hidden="true" /> Edit
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => onDuplicate(portfolio)} loading={busyId === portfolio.id}>
                      <Copy size={13} aria-hidden="true" /> Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTogglePublish(portfolio)}
                      disabled={busyId === portfolio.id}
                    >
                      {portfolio.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-dangerSoft"
                      onClick={() => setDeleteTarget(portfolio)}
                      aria-label={`Delete ${portfolio.title}`}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        busy={deleting}
        title="Delete this portfolio?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be permanently deleted, including its public link. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete portfolio"
      />

      <Modal
        open={Boolean(previewTarget)}
        onClose={() => {
          setPreviewTarget(null);
          setPreviewPortfolio(null);
        }}
        title={previewTarget ? `Preview — ${previewTarget.title}` : 'Preview'}
        description="Rendered with the saved content and selected template."
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setPreviewTarget(null);
                setPreviewPortfolio(null);
              }}
            >
              Close
            </Button>
            {previewTarget ? (
              <Link to={`/dashboard/portfolio/${previewTarget.id}/edit`} className="btn-primary" onClick={() => setPreviewTarget(null)}>
                <Pencil size={14} aria-hidden="true" /> Open editor
              </Link>
            ) : null}
          </>
        }
      >
        {previewLoading ? (
          <Spinner label="Loading saved portfolio…" />
        ) : previewPortfolio ? (
          <div className="overflow-hidden rounded border border-line bg-white">
            <TemplatePreviewFrame designWidth={1000} designHeight={1100} label="Portfolio preview">
              <PortfolioRenderer portfolio={previewPortfolio} />
            </TemplatePreviewFrame>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
