import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Loader2, Lock, Search, X } from 'lucide-react';
import TemplateCard, { TemplatePreviewModal } from './TemplateCard.jsx';
import PremiumDialog from './PremiumDialog.jsx';
import {
  TEMPLATE_CATALOGUE,
  PREMIUM_TEMPLATE_COUNT,
  FREE_TEMPLATE_COUNT,
  TEMPLATE_COUNT,
  STYLE_FACETS,
} from '../../data/templateCatalogue.js';
import {
  ACCESS_OPTIONS,
  APPEARANCE_OPTIONS,
  CATEGORY_OPTIONS,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  SORT_OPTIONS,
  activeFilterCount,
  describeRange,
  filterTemplates,
} from '../../utils/templateQuery.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { portfolioService } from '../../services/portfolioService.js';
import { ApiError } from '../../services/api.js';

/**
 * The PortiAI template explorer.
 *
 * One component powers the public gallery, the landing-page preview strip and
 * the in-dashboard template picker. Filtering, sorting and "load more" all run
 * against the real catalogue in `src/data/templateCatalogue.js`; premium access
 * is read from the API, never from local state.
 */
export default function TemplateGallery({
  mode = 'workspace',
  variant = 'page',
  usedTemplateIds = [],
  onChanged,
  onSelect,
  initialFilters,
  className = '',
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isPremium, subscription } = useAuth();

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...(initialFilters || {}) });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [preview, setPreview] = useState(null);
  const [upgradeFor, setUpgradeFor] = useState(null);
  const [creatingId, setCreatingId] = useState('');

  const debouncedSearch = useDebouncedValue(filters.search, 180);

  const results = useMemo(
    () => filterTemplates(TEMPLATE_CATALOGUE, { ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  // Any change to the query restarts the progressive reveal.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, filters.category, filters.style, filters.appearance, filters.access, filters.sort]);

  const visible = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;
  const filtersApplied = activeFilterCount(filters);
  const used = useMemo(() => new Set(usedTemplateIds), [usedTemplateIds]);

  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const isLocked = useCallback((template) => template.tier === 'premium' && !isPremium, [isPremium]);

  const useTemplate = useCallback(
    async (template, tab) => {
      if (isLocked(template)) {
        setPreview(null);
        setUpgradeFor(template);
        return;
      }

      if (onSelect) {
        onSelect(template);
        setPreview(null);
        return;
      }

      if (mode === 'marketing' && !user) {
        setPreview(null);
        navigate(`/signup?template=${encodeURIComponent(template.id)}`);
        return;
      }

      setCreatingId(template.id);
      try {
        const data = await portfolioService.create({
          templateId: template.id,
          title: `${template.name} portfolio`,
        });
        toast.success(`${template.name} selected.`, { description: 'Opening the editor with your new draft.' });
        onChanged?.(data.portfolio);
        navigate(`/dashboard/portfolio/${data.portfolio.id}/edit${tab ? `?tab=${tab}` : ''}`);
      } catch (error) {
        if (error instanceof ApiError && error.code === 'PREMIUM_REQUIRED') {
          setUpgradeFor(template);
        } else {
          toast.error(error.message || 'Could not create a portfolio with that template.');
        }
      } finally {
        setCreatingId('');
        setPreview(null);
      }
    },
    [isLocked, mode, navigate, onChanged, onSelect, toast, user]
  );

  const previewLocked = preview ? isLocked(preview) : false;
  const searchInputId = `template-search-${variant}`;

  return (
    <div className={className}>
      {/* -------------------------------------------------- Category tabs */}
      <div
        className="-mx-1 flex gap-5 overflow-x-auto border-b border-line px-1 scrollbar-none"
        role="group"
        aria-label="Filter by category"
      >
        {CATEGORY_OPTIONS.map((category) => {
          const active = filters.category === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => update({ category })}
              aria-pressed={active}
              className={`tab-link ${active ? 'tab-link-active' : ''}`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------- Search + filters */}
      <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <label htmlFor={searchInputId} className="sr-only">
            Search templates
          </label>
          <input
            id={searchInputId}
            type="search"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Search templates"
            className="input h-9 pl-9 pr-8 text-[13px]"
            autoComplete="off"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X size={12} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="filter-style">
            Visual style
          </label>
          <select id="filter-style" value={filters.style} onChange={(event) => update({ style: event.target.value })} className="select-sm flex-1 sm:flex-none">
            <option value="All">All styles</option>
            {STYLE_FACETS.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-appearance">
            Appearance
          </label>
          <select
            id="filter-appearance"
            value={filters.appearance}
            onChange={(event) => update({ appearance: event.target.value })}
            className="select-sm flex-1 sm:flex-none"
          >
            {APPEARANCE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id === 'all' ? 'Light & dark' : option.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-access">
            Access
          </label>
          <select
            id="filter-access"
            value={filters.access}
            onChange={(event) => update({ access: event.target.value })}
            className="select-sm flex-1 sm:flex-none"
          >
            {ACCESS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id === 'all' ? 'Free & premium' : option.label}
              </option>
            ))}
          </select>

          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

          <label htmlFor="filter-sort" className="sr-only">
            Sort
          </label>
          <select id="filter-sort" value={filters.sort} onChange={(event) => update({ sort: event.target.value })} className="select-sm flex-1 sm:flex-none">
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id === 'featured' ? 'Sort: Featured' : option.id === 'newest' ? 'Sort: Newest' : `Sort: ${option.label}`}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {activeFilterCount(filters) ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-ink"
            >
              <X size={11} aria-hidden="true" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* -------------------------------------------------- Status + count */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-[12.5px] font-medium text-inkSoft" aria-live="polite">
            {describeRange(visible.length, results.length)}
          </p>
          {filtersApplied ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover hover:underline hover:underline-offset-4"
            >
              <X size={11} aria-hidden="true" />
              Clear {filtersApplied} filter{filtersApplied === 1 ? '' : 's'}
            </button>
          ) : null}
          {used.size ? <span className="text-[12px] text-faint">· {used.size} in use in your workspace</span> : null}
        </div>

        {user ? (
          isPremium ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-success">
              <Check size={12} aria-hidden="true" />
              Premium · all {TEMPLATE_COUNT} unlocked
            </span>
          ) : (
            <span className="text-[12px] text-muted">
              Free plan · {FREE_TEMPLATE_COUNT} free, {PREMIUM_TEMPLATE_COUNT} premium
            </span>
          )
        ) : null}
      </div>

      {/* -------------------------------------------------- Grid */}
      {results.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-lineStrong px-6 py-14 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-muted">
            <Search size={20} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[15px] font-semibold text-ink">No templates match those filters</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-6 text-muted">
            Try a broader search term, or clear the filters to browse all {TEMPLATE_COUNT} templates.
          </p>
          <button type="button" onClick={resetFilters} className="btn-secondary mt-5">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              locked={isLocked(template)}
              used={used.has(template.id)}
              busy={creatingId === template.id}
              onPreview={setPreview}
              onUse={useTemplate}
            />
          ))}
        </div>
      )}

      {/* -------------------------------------------------- Load more */}
      {results.length > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2.5">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, results.length))}
              className="btn-secondary min-w-[190px] justify-center"
            >
              Load {Math.min(PAGE_SIZE, results.length - visibleCount)} more
              <ChevronDown size={15} aria-hidden="true" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 text-[12.5px] font-medium text-muted">
              <Check size={13} className="text-success" aria-hidden="true" />
              You have seen all {results.length} templates
              {filtersApplied ? ' matching these filters' : ''}
            </div>
          )}
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount(results.length)}
              className="text-[12px] font-medium text-accent-hover hover:underline hover:underline-offset-4"
            >
              Show all remaining
            </button>
          ) : null}
        </div>
      ) : null}

      {mode === 'marketing' && !user ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-5">
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Premium unlocks all {TEMPLATE_COUNT} templates.</p>
            <p className="mt-1 text-[13px] text-muted">
              {subscription?.billing?.providerConfigured
                ? 'Subscribe, then use any template in the catalogue.'
                : 'Create an account, then enable Premium through PortiAI support.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUpgradeFor({ id: '', name: 'the premium catalogue' })}
              className="btn-secondary"
            >
              <Lock size={13} aria-hidden="true" />
              What Premium includes
            </button>
            <button type="button" onClick={() => navigate('/signup')} className="btn-primary">
              Create an account
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {creatingId ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-muted" role="status">
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          Creating your draft…
        </p>
      ) : null}

      <TemplatePreviewModal
        template={preview}
        onClose={() => setPreview(null)}
        onUse={useTemplate}
        onCustomize={mode === 'workspace' ? (template) => useTemplate(template, 'design') : undefined}
        useLabel={previewLocked ? 'Unlock this template' : mode === 'marketing' && !user ? 'Create a free account' : 'Use this template'}
        locked={previewLocked}
        busy={Boolean(creatingId)}
      />

      <PremiumDialog
        template={upgradeFor}
        open={Boolean(upgradeFor)}
        onClose={() => setUpgradeFor(null)}
        onBrowseFree={() => {
          update({ access: 'free' });
          setUpgradeFor(null);
        }}
      />
    </div>
  );
}
