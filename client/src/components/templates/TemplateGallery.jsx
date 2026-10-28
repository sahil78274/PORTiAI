import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Lock, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      {/* -------------------------------------------------- Toolbar */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-line glass-bar px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
              <label htmlFor={searchInputId} className="sr-only">
                Search templates
              </label>
              <input
                id={searchInputId}
                type="search"
                value={filters.search}
                onChange={(event) => update({ search: event.target.value })}
                placeholder="Search by name, style or stack…"
                className="input h-10 rounded-full pl-10 pr-9 text-[13px]"
                autoComplete="off"
              />
              {filters.search ? (
                <button
                  type="button"
                  onClick={() => update({ search: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-faint hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              aria-controls="template-filter-panel"
              className={`chip-filter h-10 lg:hidden ${filtersOpen ? 'chip-filter-active' : ''}`}
            >
              <SlidersHorizontal size={13} aria-hidden="true" />
              Filters
              {filtersApplied ? <span className="rounded-full bg-white/20 px-1.5 text-[10px]">{filtersApplied}</span> : null}
            </button>

            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              <label className="sr-only" htmlFor="filter-style">
                Visual style
              </label>
              <select
                id="filter-style"
                value={filters.style}
                onChange={(event) => update({ style: event.target.value })}
                className="select-sm"
              >
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
                className="select-sm"
              >
                {APPEARANCE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
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
                className="select-sm"
              >
                {ACCESS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="filter-sort" className="hidden text-[12px] text-muted sm:block">
                Sort
              </label>
              <select
                id="filter-sort"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value })}
                className="select-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category chips */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label="Filter by category">
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => update({ category })}
                aria-pressed={filters.category === category}
                className={`chip-filter shrink-0 ${filters.category === category ? 'chip-filter-active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Collapsible filters on small screens */}
          {filtersOpen ? (
            <div id="template-filter-panel" className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-3 lg:hidden">
              <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
                Style
                <select value={filters.style} onChange={(event) => update({ style: event.target.value })} className="select-sm mt-1 w-full">
                  <option value="All">All styles</option>
                  {STYLE_FACETS.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
                Appearance
                <select value={filters.appearance} onChange={(event) => update({ appearance: event.target.value })} className="select-sm mt-1 w-full">
                  {APPEARANCE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
                Access
                <select value={filters.access} onChange={(event) => update({ access: event.target.value })} className="select-sm mt-1 w-full">
                  {ACCESS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-successLine bg-successSoft px-2.5 py-1 text-[11.5px] font-medium text-success">
              <Check size={11} aria-hidden="true" />
              Premium active · all {TEMPLATE_COUNT} templates unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted">
              Free plan · {FREE_TEMPLATE_COUNT} free, {PREMIUM_TEMPLATE_COUNT} premium
            </span>
          )
        ) : null}
      </div>

      {/* -------------------------------------------------- Grid */}
      {results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-lineStrong bg-surface px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-hover">
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
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-[12.5px] text-muted">
            Showing <span className="font-semibold text-ink">{visible.length}</span> of {results.length} templates
            {results.length === TEMPLATE_CATALOGUE.length ? ' in the catalogue' : ' matching your filters'}
          </p>
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, results.length))}
              className="btn-secondary btn-lg min-w-[190px] justify-center"
            >
              <Sparkles size={15} aria-hidden="true" />
              Load {Math.min(PAGE_SIZE, results.length - visibleCount)} more
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[12.5px] font-medium text-muted">
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
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
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
