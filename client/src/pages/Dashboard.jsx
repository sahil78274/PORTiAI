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
  Sparkles,
  ArrowUpRight,
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
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {counts.total === 0
              ? 'Create your first portfolio to get started.'
              : `You have ${counts.total} portfolio${counts.total === 1 ? '' : 's'} · ${counts.published} published, ${counts.drafts} in draft mode.`}
          </p>
        </div>
        <Link to="/dashboard/create" className="btn-primary">
          <Plus size={15} aria-hidden="true" />
          <span>New Portfolio</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Portfolios', value: counts.total, icon: FolderOpen, helper: 'Active records' },
          { label: 'Published Links', value: counts.published, icon: Globe, helper: 'Publicly reachable' },
          { label: 'Drafts', value: counts.drafts, icon: FileText, helper: 'Work in progress' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-4 bg-surface shadow-xs flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{card.value}</p>
                <p className="mt-0.5 text-2xs text-slate-400">{card.helper}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                <Icon size={18} aria-hidden="true" />
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-2.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              aria-pressed={status === filter.id}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all ${
                status === filter.id
                  ? 'bg-slate-100 text-ink shadow-2xs'
                  : 'text-slate-500 hover:text-ink hover:bg-slate-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search portfolios…"
              aria-label="Search portfolios by title or name"
              className="input pl-8 py-1.5 text-xs w-full sm:w-56"
            />
          </div>

          <label htmlFor="sort" className="sr-only">
            Sort portfolios
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="select py-1.5 text-xs w-full sm:w-44"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button variant="secondary" size="sm" onClick={() => load()} aria-label="Refresh list">
            <RefreshCw size={13} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="card h-20 animate-pulse bg-slate-100/70" />
            ))}
            <div className="pt-2 flex justify-center">
              <Spinner label="Loading your portfolios…" />
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="card border-red-200 bg-red-50 p-5 rounded-xl">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => load()}>
              Try again
            </Button>
          </div>
        ) : portfolios.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={search || status !== 'all' ? 'No matching portfolios' : 'No portfolios yet'}
            description={
              search || status !== 'all'
                ? 'Adjust the search filter to display other portfolios in your account.'
                : 'Complete the structured wizard to build your first portfolio draft. It takes about five minutes.'
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
                  <Plus size={15} aria-hidden="true" />
                  <span>Create new portfolio</span>
                </Link>
              )
            }
          />
        ) : (
          <ul className="space-y-3">
            {portfolios.map((portfolio) => {
              const templateObj = getTemplate(portfolio.templateId);
              return (
                <li key={portfolio.id} className="card-hover p-4 sm:p-5 bg-surface rounded-xl">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line shadow-2xs"
                        style={{ backgroundColor: `${portfolio.accent || templateObj.accent}14` }}
                        aria-hidden="true"
                      >
                        <LayoutTemplate size={18} style={{ color: portfolio.accent || templateObj.accent }} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/dashboard/portfolio/${portfolio.id}/edit`}
                            className="truncate text-base font-semibold text-ink hover:text-accent transition-colors"
                          >
                            {portfolio.title}
                          </Link>
                          <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
                            {portfolio.published ? 'Published' : 'Draft'}
                          </span>
                          {portfolio.analysisScore !== null ? (
                            <span
                              className="badge border-line bg-slate-50 text-slate-700 font-medium"
                              title={`Last analysis source: ${portfolio.analysisSource}`}
                            >
                              <Gauge size={11} aria-hidden="true" className="text-slate-500" />
                              <span>{portfolio.analysisScore}/100</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted">
                          <span className="font-medium text-slate-700">{templateObj.name}</span>
                          {portfolio.fullName ? ` · ${portfolio.fullName}` : ''}
                          {portfolio.projectCount ? ` · ${portfolio.projectCount} project${portfolio.projectCount === 1 ? '' : 's'}` : ''}
                          {' · Updated '}
                          <span title={formatDate(portfolio.updatedAt)} className="font-medium text-slate-600">
                            {formatRelative(portfolio.updatedAt)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center">
                      {portfolio.published && portfolio.slug ? (
                        <>
                          <a
                            href={`/p/${portfolio.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost btn-sm text-xs font-semibold"
                          >
                            <ExternalLink size={13} aria-hidden="true" />
                            <span>Open</span>
                          </a>
                          <Button variant="ghost" size="sm" onClick={() => copyLink(portfolio)}>
                            <Copy size={13} aria-hidden="true" />
                            <span>Copy link</span>
                          </Button>
                        </>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => openPreview(portfolio)}>
                        <Eye size={13} aria-hidden="true" />
                        <span>Preview</span>
                      </Button>
                      <Link to={`/dashboard/portfolio/${portfolio.id}/analyze`} className="btn-ghost btn-sm text-xs font-semibold">
                        <Gauge size={13} aria-hidden="true" />
                        <span>Analyze</span>
                      </Link>
                      <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-secondary btn-sm text-xs font-semibold">
                        <Pencil size={13} aria-hidden="true" />
                        <span>Edit</span>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => onDuplicate(portfolio)} loading={busyId === portfolio.id}>
                        <Copy size={13} aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Duplicate</span>
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
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTarget(portfolio)}
                        aria-label={`Delete ${portfolio.title}`}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
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
            ? `“${deleteTarget.title}” will be permanently deleted, including its public URL. This cannot be undone.`
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
                <Pencil size={14} aria-hidden="true" />
                <span>Open editor</span>
              </Link>
            ) : null}
          </>
        }
      >
        {previewLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner label="Loading saved portfolio…" />
          </div>
        ) : previewPortfolio ? (
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <TemplatePreviewFrame designWidth={1000} designHeight={1100} label="Portfolio preview">
              <PortfolioRenderer portfolio={previewPortfolio} />
            </TemplatePreviewFrame>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
