import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, Search } from 'lucide-react';
import { TEMPLATE_CATALOGUE } from '../../data/templateCatalogue.js';
import { filterTemplates } from '../../utils/templateQuery.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PremiumDialog from './PremiumDialog.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';

const INITIAL_LIMIT = 12;

/**
 * Compact template chooser for the editor's Appearance tab.
 *
 * Shows the whole catalogue (not just the six originals) with the active
 * design marked. Premium designs open the upgrade dialog for free accounts;
 * the API also rejects the save, so the gate holds even if the UI is bypassed.
 */
export default function TemplatePicker({ value, onSelect }) {
  const { isPremium } = useAuth();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [upgradeFor, setUpgradeFor] = useState(null);
  const debounced = useDebouncedValue(search, 150);

  const results = useMemo(
    () => filterTemplates(TEMPLATE_CATALOGUE, { search: debounced, sort: 'featured' }),
    [debounced]
  );
  const visible = results.slice(0, limit);

  return (
    <div className="editor-picker">
      <div className="relative min-w-0">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setLimit(INITIAL_LIMIT);
          }}
          placeholder={`Search ${TEMPLATE_CATALOGUE.length} templates`}
          aria-label="Search templates"
          className="input h-10 pl-9 text-sm"
        />
      </div>

      <div className="editor-picker-grid mt-3 max-h-[420px] overflow-y-auto pr-1 scroll-slim">
        {visible.map((template) => {
          const active = value === template.id;
          const locked = template.tier === 'premium' && !isPremium;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                if (locked) {
                  setUpgradeFor(template);
                  return;
                }
                onSelect(template);
              }}
              aria-pressed={active}
              className={`min-w-0 w-full rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-accent bg-accent-soft ring-1 ring-accent'
                  : 'border-line bg-surface hover:border-lineStrong hover:bg-canvasAlt'
              }`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{template.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">
                    {template.layoutLabel} · {template.styleLabel}
                  </span>
                </span>
                {active ? (
                  <Check size={14} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
                ) : locked ? (
                  <Lock size={12} className="mt-0.5 shrink-0 text-faint" aria-label="Premium template" />
                ) : null}
              </span>
              <span className="mt-2 flex items-center gap-1.5">
                {template.swatches.map((color, index) => (
                  <span key={index} className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ background: color }} />
                ))}
                <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${template.tier === 'free' ? 'bg-successSoft text-success' : 'bg-accent-soft text-accent-hover'}`}>
                  {template.tier === 'free' ? 'Free' : 'Premium'}
                </span>
              </span>
            </button>
          );
        })}
        {!visible.length ? <p className="col-span-full px-1 py-6 text-center text-[12.5px] text-muted">No templates match “{search}”.</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-[11.5px] text-muted">
          Showing {visible.length} of {results.length}
        </p>
        <div className="flex items-center gap-3">
          {visible.length < results.length ? (
            <button type="button" onClick={() => setLimit((count) => count + INITIAL_LIMIT)} className="btn-secondary btn-sm">
              Load more
            </button>
          ) : null}
          <Link to="/templates" className="text-[12px] font-medium text-accent-hover hover:underline hover:underline-offset-4">
            Open gallery
          </Link>
        </div>
      </div>

      <PremiumDialog template={upgradeFor} open={Boolean(upgradeFor)} onClose={() => setUpgradeFor(null)} />
    </div>
  );
}
