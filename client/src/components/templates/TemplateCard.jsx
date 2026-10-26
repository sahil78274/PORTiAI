import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Monitor, Smartphone, Tablet, Sparkles, Check, ArrowRight } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import Modal from '../ui/Modal.jsx';
import { demoPortfolioFor } from '../../utils/demoPortfolio.js';

/** Mounts the (heavy) live template preview only when the card scrolls into view. */
const LazyPreview = ({ template, height = 250 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {visible ? (
        <TemplatePreviewFrame designWidth={1000} designHeight={720} label={`${template.name} template preview`}>
          <PortfolioRenderer portfolio={demoPortfolioFor(template.id, template.accent)} />
        </TemplatePreviewFrame>
      ) : (
        <div className="skeleton h-[250px] w-full rounded-none" aria-hidden="true" />
      )}
    </div>
  );
};

const DEVICE_WIDTHS = {
  desktop: 1280,
  tablet: 834,
  mobile: 430,
};

export function TemplatePreviewModal({ template, onClose, onUse, onCustomize, customizeLabel = 'Customize design', useLabel = 'Use this template', busy = false }) {
  const [device, setDevice] = useState('desktop');
  if (!template) return null;
  const portfolio = demoPortfolioFor(template.id, template.accent);

  return (
    <Modal
      open={Boolean(template)}
      onClose={onClose}
      size="xl"
      title={`${template.name} — live preview`}
      description="Rendered with illustrative sample content by the same component used for published portfolios."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          {onCustomize ? (
            <button type="button" onClick={() => onCustomize(template)} className="btn-secondary" disabled={busy}>
              {customizeLabel}
            </button>
          ) : null}
          <button type="button" onClick={() => onUse?.(template)} className="btn-primary" disabled={busy}>
            <Sparkles size={15} aria-hidden="true" />
            {busy ? 'Preparing…' : useLabel}
          </button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-2xs text-muted">
          <span className="badge border-lineStrong bg-white/[0.04] text-inkSoft">{template.categories.join(' · ')}</span>
          <span>Best for {template.bestFor.toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-canvasDeep p-0.5" role="group" aria-label="Preview device">
          {[
            { id: 'desktop', Icon: Monitor, label: 'Desktop' },
            { id: 'tablet', Icon: Tablet, label: 'Tablet' },
            { id: 'mobile', Icon: Smartphone, label: 'Mobile' },
          ].map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              aria-pressed={device === id}
              aria-label={`${label} preview`}
              className={`rounded-md p-1.5 transition-colors ${
                device === id ? 'bg-white/[0.09] text-white' : 'text-faint hover:text-ink'
              }`}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-lineStrong/60 bg-canvasDeep">
        <div className="flex items-center gap-2 border-b border-line bg-canvasAlt px-3 py-2" aria-hidden="true">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
          </span>
          <span className="mx-auto max-w-[60%] truncate rounded bg-white/[0.05] px-3 py-0.5 text-[10px] text-faint">
            portiai.app/p/sample-{template.id}
          </span>
        </div>
        <div className="mx-auto transition-all duration-300" style={{ width: '100%', maxWidth: device === 'desktop' ? '100%' : `${DEVICE_WIDTHS[device]}px` }}>
          <TemplatePreviewFrame designWidth={1100} designHeight={device === 'mobile' ? 620 : 900} label={`${template.name} preview`} crop>
            <PortfolioRenderer portfolio={portfolio} />
          </TemplatePreviewFrame>
        </div>
      </div>
    </Modal>
  );
}

export default function TemplateCard({ template, selected = false, onPreview, onUse, useHref }) {
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-lineStrong hover:shadow-raised ${
        selected ? 'ring-2 ring-accent-hover/60' : ''
      }`}
    >
      <div className="relative overflow-hidden border-b border-line">
        <LazyPreview template={template} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050813] via-transparent to-transparent opacity-60" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex translate-y-0 items-center justify-center gap-2 p-3 transition-all duration-300 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onPreview?.(template)}
            className="btn-secondary btn-sm bg-[#070b18]/90 backdrop-blur"
          >
            <Eye size={13} aria-hidden="true" />
            Preview
          </button>
          {onUse ? (
            <button type="button" onClick={() => onUse(template)} className="btn-primary btn-sm">
              <Sparkles size={13} aria-hidden="true" />
              Use template
            </button>
          ) : useHref ? (
            <Link to={useHref} className="btn-primary btn-sm">
              <ArrowRight size={13} aria-hidden="true" />
              Use template
            </Link>
          ) : null}
        </div>
        {selected ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-[#052e22]/90 px-2.5 py-1 text-2xs font-semibold text-success backdrop-blur">
            <Check size={11} aria-hidden="true" />
            Selected
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#070b18]/80 px-2.5 py-1 text-2xs font-medium uppercase tracking-wider text-inkSoft backdrop-blur">
            {template.tone === 'light' ? 'Light' : template.tone === 'dark' ? 'Dark' : 'Hybrid'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-white">{template.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{template.tagline}</p>
          </div>
          <div className="flex shrink-0 gap-1" aria-hidden="true">
            {template.swatches.map((color) => (
              <span key={color} className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: color }} />
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.categories.slice(0, 2).map((category) => (
            <span key={category} className="chip !px-2 !py-0.5 !text-[10px] uppercase tracking-wider">
              {category}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <p className="text-2xs text-faint">{template.bestFor}</p>
          <button
            type="button"
            onClick={() => onPreview?.(template)}
            className="inline-flex items-center gap-1 text-2xs font-semibold text-accent-hover transition-colors hover:text-white"
          >
            View
            <ArrowRight size={11} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
