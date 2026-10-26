import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Search, Sparkles, Check, X } from 'lucide-react';
import TemplateCard, { TemplatePreviewModal } from './TemplateCard.jsx';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../../utils/templates.js';
import { useToast } from '../../context/ToastContext.jsx';
import { portfolioService } from '../../services/portfolioService.js';

/**
 * Template marketplace grid used both on the public marketing site and inside
 * the dashboard. In workspace mode "Use template" creates an empty draft with
 * that template and opens the editor.
 */
export default function TemplateGallery({ mode = 'workspace', usedTemplateIds = [], onChanged, className = '' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [preview, setPreview] = useState(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return TEMPLATES.filter((template) => {
      const matchesCategory = category === 'All' || template.categories.includes(category);
      const matchesSearch =
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.tagline.toLowerCase().includes(term) ||
        template.bestFor.toLowerCase().includes(term) ||
        template.categories.some((item) => item.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const useTemplate = async (template, tab) => {
    if (mode === 'marketing') {
      navigate(`/register?template=${template.id}`);
      return;
    }
    setCreating(true);
    try {
      const data = await portfolioService.create({ templateId: template.id, title: `${template.name} portfolio` });
      toast.success(`${template.name} selected.`, { description: 'Opening the editor with your new draft.' });
      onChanged?.(data.portfolio);
      navigate(`/dashboard/portfolio/${data.portfolio.id}/edit${tab ? `?tab=${tab}` : ''}`);
    } catch (error) {
      toast.error(error.message || 'Could not create a portfolio with that template.');
    } finally {
      setCreating(false);
      setPreview(null);
    }
  };

  const used = new Set(usedTemplateIds);

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates by name or use case…"
            aria-label="Search templates"
            className="input h-10 pl-9 text-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter templates by category">
          {TEMPLATE_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`chip !py-1.5 ${category === item ? 'chip-active' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-faint">
        <p>
          {filtered.length} template{filtered.length === 1 ? '' : 's'}
          {search ? ` matching “${search}”` : ''}
          {category !== 'All' ? ` in ${category}` : ''}
        </p>
        {used.size ? (
          <p className="inline-flex items-center gap-1.5 text-success">
            <Check size={11} aria-hidden="true" />
            {used.size} in use in your workspace
          </p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-lineStrong/70 bg-surface/40 px-6 py-14 text-center">
          <LayoutGrid size={24} className="text-faint" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white">No templates match that search</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            Try a broader term, or reset the filters to see all nine templates.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('All');
            }}
            className="btn-secondary btn-sm mt-4"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={used.has(template.id)}
              onPreview={setPreview}
              onUse={useTemplate}
            />
          ))}
        </div>
      )}

      <TemplatePreviewModal
        template={preview}
        onClose={() => setPreview(null)}
        onUse={useTemplate}
        onCustomize={mode === 'workspace' ? (template) => useTemplate(template, 'design') : undefined}
        useLabel={mode === 'marketing' ? 'Create a free account' : 'Use this template'}
        busy={creating}
      />

      {mode === 'workspace' ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/50 px-4 py-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} className="text-accent-hover" aria-hidden="true" />
            Every template shares the same content model — switching designs never loses your work.
          </span>
          <button type="button" onClick={() => navigate('/dashboard/builder')} className="font-medium text-accent-hover hover:text-white">
            Prefer AI drafting? Open the builder →
          </button>
        </div>
      ) : null}
    </div>
  );
}
