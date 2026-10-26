import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import TemplateCard, { TemplatePreviewModal } from './TemplateCard.jsx';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../../utils/templates.js';
import { useToast } from '../../context/ToastContext.jsx';
import { portfolioService } from '../../services/portfolioService.js';

/**
 * Template gallery used on the public templates page and inside the dashboard.
 * In workspace mode "Use template" creates an empty draft with that design.
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
      navigate(`/signup?template=${template.id}`);
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
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            className="input h-9 pl-9 text-[13px]"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X size={12} aria-hidden="true" />
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
              className={`rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                category === item
                  ? 'border-accent/40 bg-accent-soft text-accent-hover'
                  : 'border-line bg-surface text-muted hover:border-lineStrong hover:text-ink'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12px] text-faint">
        {filtered.length} template{filtered.length === 1 ? '' : 's'}
        {category !== 'All' ? ` in ${category}` : ''}
        {search ? ` matching “${search}”` : ''}
        {used.size ? ` · ${used.size} in use in your workspace` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-lineStrong px-6 py-12 text-center">
          <p className="text-sm font-medium">No templates match those filters</p>
          <p className="mt-1 text-[13px] text-muted">Try a different search term, or reset to see all six templates.</p>
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
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
