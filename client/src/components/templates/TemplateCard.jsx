import { useState } from 'react';
import { Monitor, Smartphone, Tablet, Sparkles } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import Modal from '../ui/Modal.jsx';
import TemplateThumb from './TemplateThumb.jsx';
import { demoPortfolioFor } from '../../utils/demoPortfolio.js';

const DEVICE_WIDTHS = {
  desktop: 1440,
  tablet: 834,
  mobile: 430,
};

export function TemplatePreviewModal({ template, onClose, onUse, onCustomize, useLabel = 'Use this template', busy = false }) {
  const [device, setDevice] = useState('desktop');
  if (!template) return null;
  const portfolio = demoPortfolioFor(template.id, template.accent);

  return (
    <Modal
      open={Boolean(template)}
      onClose={onClose}
      size="xl"
      title={`${template.name} — preview`}
      description="Rendered with sample content by the same component used for published portfolios."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          {onCustomize ? (
            <button type="button" onClick={() => onCustomize(template)} className="btn-secondary" disabled={busy}>
              Customize design
            </button>
          ) : null}
          <button type="button" onClick={() => onUse?.(template)} className="btn-primary" disabled={busy}>
            <Sparkles size={14} aria-hidden="true" />
            {busy ? 'Preparing…' : useLabel}
          </button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span className="rounded border border-line px-1.5 py-0.5 text-[11px]">{template.categories.join(' · ')}</span>
          <span>Best for {template.bestFor.toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-canvas p-0.5" role="group" aria-label="Preview width">
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
              className={`rounded p-1.5 transition-colors ${
                device === id ? 'bg-surface text-ink ' : 'text-faint hover:text-ink'
              }`}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-canvas">
        <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-1.5 text-[11px] text-muted">
          <span className="font-medium text-inkSoft">{template.name}</span>
          <span className="capitalize">{device} preview · sample content</span>
        </div>
        <div className="mx-auto transition-[max-width] duration-200" style={{ maxWidth: device === 'desktop' ? '100%' : `${DEVICE_WIDTHS[device]}px` }}>
          <TemplatePreviewFrame
            designWidth={DEVICE_WIDTHS[device] === 1440 ? 1200 : DEVICE_WIDTHS[device]}
            designHeight={device === 'mobile' ? 720 : 900}
            label={`${template.name} preview at ${device} width`}
            crop
          >
            <PortfolioRenderer portfolio={portfolio} />
          </TemplatePreviewFrame>
        </div>
      </div>
    </Modal>
  );
}

export default function TemplateCard({ template, selected = false, onPreview, onUse, useHref }) {
  return (
    <article className={`overflow-hidden rounded-lg border bg-surface transition-colors ${selected ? 'border-accent/50' : 'border-line hover:border-lineStrong'}`}>
      <div className="relative border-b border-line">
        <TemplateThumb template={template} designHeight={620} />
        {selected ? (
          <span className="absolute left-2.5 top-2.5 rounded border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">
            In use
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold">{template.name}</h3>
            <p className="mt-0.5 text-[12px] leading-5 text-muted">{template.tagline}</p>
          </div>
          <div className="flex shrink-0 gap-1 pt-1" aria-hidden="true">
            {template.swatches.map((color) => (
              <span key={color} className="h-3 w-3 rounded-full border border-lineStrong" style={{ background: color }} />
            ))}
          </div>
        </div>

        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {template.traits.map((trait) => (
            <li key={trait} className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] text-muted">
              {trait}
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => onPreview?.(template)} className="btn-secondary btn-sm">
            Preview
          </button>
          {onUse ? (
            <button type="button" onClick={() => onUse(template)} className="btn-primary btn-sm">
              Use template
            </button>
          ) : useHref ? (
            <a href={useHref} className="btn-primary btn-sm">
              Use template
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
