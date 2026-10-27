import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Copy,
  Eye,
  ExternalLink,
  FolderOpen,
  Gauge,
  Globe2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Undo2,
} from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { Button, EmptyState, Spinner } from '../components/ui/Primitives.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Modal from '../components/ui/Modal.jsx';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { formatDate, formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
];

const SORTS = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Recently created' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'status', label: 'Published first' },
];

const Thumbnail = ({ portfolio, large = false }) => {
  const template = getTemplate(portfolio.templateId);
  const accent = portfolio.accent || template.accent;
  const light = template.tone === 'light';
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-line ${large ? 'aspect-[16/10] w-full' : 'h-16 w-24 shrink-0'}`}
      style={{ background: light ? '#ffffff' : '#14171c' }}
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className={`absolute ${large ? 'inset-5 space-y-2' : 'inset-2.5 space-y-1'}`}>
        <div className={`${large ? 'h-2.5 w-24' : 'h-1.5 w-9'} rounded-full`} style={{ background: light ? '#111827' : '#ffffff', opacity: 0.85 }} />
        <div className={`${large ? 'h-2 w-36' : 'h-1 w-12'} rounded-full`} style={{ background: accent }} />
        <div className={`${large ? 'mt-4 grid grid-cols-3 gap-2' : 'mt-2 grid grid-cols-2 gap-1'}`}>
          {[0, 1, 2].slice(0, large ? 3 : 2).map((index) => (
            <div
              key={index}
              className={`${large ? 'h-12' : 'h-4'} rounded`}
              style={{ background: light ? '#ffffff' : 'rgba(255,255,255,0.08)', border: `1px solid ${light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'}` }}
            />
          ))}
        </div>
        <div className={`${large ? 'h-1.5 w-20' : 'h-1 w-8'} rounded-full`} style={{ background: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.16)' }} />
      </div>
      {large ? (
        <span className="absolute bottom-2 right-2 rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: light ? '#00000088' : '#ffffff88' }}>
          {template.name}
        </span>
      ) : null}
    </div>
  );
};

export default function MyPortfolios() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [portfolios, setPortfolios] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('list');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      setError('');
      try {
        const data = await portfolioService.list({ search: debounced, status, sort });
        setPortfolios(data.portfolios || []);
        setStats(data.stats || { total: 0, published: 0, drafts: 0 });
      } catch (err) {
        setError(err.message || 'Could not load your portfolios.');
      } finally {
        setLoading(false);
      }
    },
    [debounced, status, sort]
  );

  useEffect(() => {
    load();
  }, [load]);

  // The dashboard search box navigates here with ?q=; adopt it when it changes.
  useEffect(() => {
    const incoming = params.get('q') || '';
    setSearch((current) => (current === incoming ? current : incoming));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Keep the URL shareable with the active filters.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced) next.set('q', debounced);
    if (status !== 'all') next.set('status', status);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, status]);

  const openPreview = async (portfolio) => {
    setPreviewTarget(portfolio);
    setPreviewData(null);
    setPreviewLoading(true);
    try {
      const data = await portfolioService.get(portfolio.id);
      setPreviewData(data.portfolio);
    } catch (err) {
      toast.error(err.message || 'Could not load the preview.');
      setPreviewTarget(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const duplicate = async (portfolio) => {
    setBusyId(portfolio.id);
    try {
      const data = await portfolioService.duplicate(portfolio.id);
      toast.success(`Duplicated as “${data.portfolio.title}”.`);
      await load({ quiet: true });
    } catch (err) {
      toast.error(err.message || 'Could not duplicate this portfolio.');
    } finally {
      setBusyId(null);
    }
  };

  const share = async (portfolio) => {
    if (!portfolio.published || !portfolio.slug) {
      toast.info('Publish this portfolio first to get a public link.', {
        description: 'Open the editor and press Publish when the draft is ready.',
      });
      return;
    }
    const url = `${window.location.origin}/p/${portfolio.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public link copied.');
    } catch {
      toast.info('Copy this link manually:', { description: url, duration: 9000 });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await portfolioService.remove(deleteTarget.id);
      toast.success('Portfolio deleted.');
      setDeleteTarget(null);
      await load({ quiet: true });
    } catch (err) {
      toast.error(err.message || 'Could not delete this portfolio.');
    } finally {
      setDeleting(false);
    }
  };

  const emptySearch = Boolean(debounced) || status !== 'all';

  const counts = useMemo(() => stats, [stats]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My portfolios"
        description={`${counts.total} total · ${counts.published} published · ${counts.drafts} draft${counts.drafts === 1 ? '' : 's'}. Search, filter and manage them from here.`}
        actions={
          <>
            <Link to="/dashboard/templates" className="btn-secondary btn-sm">
              <LayoutGrid size={14} aria-hidden="true" />
              Templates
            </Link>
            <Link to="/dashboard/builder" className="btn-primary btn-sm">
              <Plus size={14} aria-hidden="true" />
              Create new
            </Link>
          </>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-2.5">
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, name or role…"
            aria-label="Search portfolios"
            className="input h-9 py-1.5 pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-0.5" role="group" aria-label="Status filter">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              aria-pressed={status === filter.id}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                status === filter.id ? 'bg-canvasAlt text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort portfolios" className="select h-9 w-auto py-1.5 text-xs">
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-0.5 rounded-lg border border-line bg-canvas p-0.5" role="group" aria-label="Layout">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            aria-label="Grid view"
            className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-canvasAlt text-ink' : 'text-faint hover:text-ink'}`}
          >
            <LayoutGrid size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            aria-label="List view"
            className={`rounded-md p-1.5 ${view === 'list' ? 'bg-canvasAlt text-ink' : 'text-faint hover:text-ink'}`}
          >
            <List size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dangerLine bg-dangerSoft px-4 py-3 text-[13px] text-danger">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="rounded-lg border border-line bg-surface p-3">
              <div className="skeleton aspect-[16/10] w-full" />
              <div className="skeleton mt-4 h-4 w-32" />
              <div className="skeleton mt-2 h-3 w-48" />
            </div>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={emptySearch ? 'No portfolios match those filters' : 'No portfolios yet'}
          description={
            emptySearch
              ? 'Try a different search term, or reset the filters to see everything in your workspace.'
              : 'Create your first portfolio with the AI builder, or start from one of six templates.'
          }
          action={
            emptySearch ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                }}
              >
                <Undo2 size={14} aria-hidden="true" />
                Reset filters
              </Button>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/dashboard/builder" className="btn-primary btn-sm">
                  Create with AI
                </Link>
                <Link to="/dashboard/templates" className="btn-secondary btn-sm">
                  <LayoutGrid size={13} aria-hidden="true" />
                  Browse templates
                </Link>
              </div>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {portfolios.map((portfolio) => (
            <article key={portfolio.id} className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-lineStrong">
              <button type="button" onClick={() => openPreview(portfolio)} className="text-left" aria-label={`Preview ${portfolio.title}`}>
                <Thumbnail portfolio={portfolio} large />
              </button>
              <div className="flex flex-1 flex-col p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="block truncate text-sm font-semibold text-ink hover:text-accent-hover">
                      {portfolio.title}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {getTemplate(portfolio.templateId).name}
                      {portfolio.projectCount ? ` · ${portfolio.projectCount} project${portfolio.projectCount === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                  <span className={portfolio.published ? 'badge-published shrink-0' : 'badge-draft shrink-0'}>
                    {portfolio.published ? 'Live' : 'Draft'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                  <span title={formatDate(portfolio.updatedAt)}>Updated {formatRelative(portfolio.updatedAt)}</span>
                  {portfolio.hasAnalysis ? (
                    <span className="inline-flex items-center gap-1 text-inkSoft">
                      <Gauge size={11} aria-hidden="true" />
                      {portfolio.analysisScore}/100
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
                  <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-secondary btn-sm flex-1 justify-center">
                    <Pencil size={12} aria-hidden="true" />
                    Edit
                  </Link>
                  <button type="button" onClick={() => openPreview(portfolio)} className="btn-ghost btn-sm h-8 w-8 p-0" aria-label={`Preview ${portfolio.title}`} title="Preview">
                    <Eye size={14} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => share(portfolio)} className="btn-ghost btn-sm h-8 w-8 p-0" aria-label={`Share ${portfolio.title}`} title={portfolio.published ? 'Copy public link' : 'Publish to share'}>
                    <Copy size={13} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicate(portfolio)}
                    disabled={busyId === portfolio.id}
                    className="btn-ghost btn-sm h-8 w-8 p-0"
                    aria-label={`Duplicate ${portfolio.title}`}
                    title="Duplicate"
                  >
                    <MoreHorizontal size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(portfolio)}
                    className="btn-ghost btn-sm h-8 w-8 p-0 text-danger hover:bg-dangerSoft hover:text-danger"
                    aria-label={`Delete ${portfolio.title}`}
                    title="Delete"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <ul className="divide-y divide-line">
            {portfolios.map((portfolio) => (
              <li key={portfolio.id} className="flex flex-wrap items-center gap-3 p-3 transition-colors hover:bg-canvasAlt">
                <Thumbnail portfolio={portfolio} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="truncate text-sm font-semibold text-ink hover:text-accent-hover">
                      {portfolio.title}
                    </Link>
                    <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>{portfolio.published ? 'Published' : 'Draft'}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {getTemplate(portfolio.templateId).name} · updated {formatRelative(portfolio.updatedAt)} · {portfolio.projectCount} project
                    {portfolio.projectCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {portfolio.published && portfolio.slug ? (
                    <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm" title="Open public page">
                      <ExternalLink size={13} aria-hidden="true" />
                      <span className="hidden sm:inline">Open</span>
                    </a>
                  ) : null}
                  <Link to={`/dashboard/portfolio/${portfolio.id}/analyze`} className="btn-ghost btn-sm" title="Analyze">
                    <Gauge size={13} aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={() => openPreview(portfolio)} className="btn-ghost btn-sm" title="Preview">
                    <Eye size={13} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => share(portfolio)} className="btn-ghost btn-sm" title="Share">
                    <Copy size={13} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => duplicate(portfolio)} disabled={busyId === portfolio.id} className="btn-ghost btn-sm" title="Duplicate">
                    <MoreHorizontal size={13} aria-hidden="true" />
                  </button>
                  <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-secondary btn-sm">
                    Edit
                  </Link>
                  <button type="button" onClick={() => setDeleteTarget(portfolio)} className="btn-ghost btn-sm text-danger hover:bg-dangerSoft hover:text-danger" title="Delete">
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && portfolios.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1.5">
            <Globe2 size={12} aria-hidden="true" />
            Published portfolios are readable by anyone with the link. Drafts return 404 publicly.
          </span>
          <Link to="/dashboard/analyzer" className="inline-flex items-center gap-1 font-medium text-accent-hover hover:text-ink">
            <Gauge size={12} aria-hidden="true" />
            Analyze a portfolio
          </Link>
        </div>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          busy={deleting}
          title={`Delete “${deleteTarget.title}”?`}
          description={
            deleteTarget.published
              ? 'This portfolio is currently published. Deleting it removes the public link permanently. This cannot be undone.'
              : 'This draft and all of its content will be permanently deleted. This cannot be undone.'
          }
          confirmLabel="Delete portfolio"
        />
      ) : null}

      <Modal
        open={Boolean(previewTarget)}
        onClose={() => {
          setPreviewTarget(null);
          setPreviewData(null);
        }}
        title={previewTarget ? `Preview — ${previewTarget.title}` : 'Preview'}
        description="Rendered from the saved portfolio data with its selected template."
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setPreviewTarget(null);
                setPreviewData(null);
              }}
            >
              Close
            </Button>
            {previewTarget ? (
              <Link to={`/dashboard/portfolio/${previewTarget.id}/edit`} className="btn-primary" onClick={() => setPreviewTarget(null)}>
                <Pencil size={14} aria-hidden="true" />
                Open editor
              </Link>
            ) : null}
          </>
        }
      >
        {previewLoading ? (
          <div className="flex justify-center py-12">
            <Spinner label="Loading saved portfolio…" />
          </div>
        ) : previewData ? (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="h-[60vh] overflow-y-auto">
              <PortfolioRenderer
                portfolio={previewData}
                blogHref={previewData.blog?.enabled && previewData.slug ? `/p/${previewData.slug}/blog` : undefined}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
