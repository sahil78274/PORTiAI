import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, Lock, Maximize2, Monitor, Smartphone, Tablet } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import Modal from '../ui/Modal.jsx';
import TemplateThumb from './TemplateThumb.jsx';
import { demoPortfolioForTemplate } from '../../data/premiumDemo.js';

const DEVICE_WIDTHS = { desktop: 1280, tablet: 834, mobile: 430 };

/** Full-size preview dialog used by the gallery and the landing page. */
export function TemplatePreviewModal({ template, onClose, onUse, onCustomize, useLabel, locked = false, busy = false }) {
  const [device, setDevice] = useState('desktop');
  if (!template) return null;
  const portfolio = demoPortfolioForTemplate(template);
  const previewWidth = DEVICE_WIDTHS[device];
  const label = useLabel || (locked ? 'Unlock this template' : 'Use this template');

  return (
    <Modal
      open={Boolean(template)}
      onClose={onClose}
      size="xl"
      title={`${template.name} — preview`}
      description={`${template.layoutLabel} layout · ${template.styleLabel} style · rendered with sample content by the same component a published portfolio uses.`}
      footer={
        <>
          <Link to={`/templates/${template.id}`} className="btn-secondary mr-auto" onClick={onClose}>
            <Maximize2 size={13} aria-hidden="true" />
            Open full page
          </Link>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          {onCustomize ? (
            <button type="button" onClick={() => onCustomize(template)} className="btn-secondary" disabled={busy}>
              Customize design
            </button>
          ) : null}
          <button type="button" onClick={() => onUse?.(template)} className="btn-primary" disabled={busy}>
            {locked ? <Lock size={13} aria-hidden="true" /> : null}
            {busy ? 'Preparing…' : label}
          </button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span className={template.tier === 'free' ? 'badge-free' : 'badge-premium'}>
            {template.tier === 'free' ? 'Free' : 'Premium'}
          </span>
          <span>{template.category}</span>
          <span aria-hidden="true">·</span>
          <span>{template.appearance === 'dark' ? 'Dark' : 'Light'} appearance</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-full border border-line bg-canvas p-0.5" role="group" aria-label="Preview width">
          {[
            { id: 'desktop', Icon: Monitor, label: 'Desktop' },
            { id: 'tablet', Icon: Tablet, label: 'Tablet' },
            { id: 'mobile', Icon: Smartphone, label: 'Mobile' },
          ].map(({ id, Icon, label: deviceLabel }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              aria-pressed={device === id}
              aria-label={`${deviceLabel} preview`}
              className={`rounded-full p-1.5 transition-colors ${device === id ? 'bg-surface text-ink shadow-raised' : 'text-faint hover:text-ink'}`}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-canvas">
        <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-1.5 text-[11px] text-muted">
          <span className="font-medium text-inkSoft">{template.name}</span>
          <span className="capitalize">
            {device} preview · sample content
          </span>
        </div>
        <div className="mx-auto transition-[max-width] duration-200" style={{ maxWidth: device === 'desktop' ? '100%' : `${previewWidth}px` }}>
          <TemplatePreviewFrame
            designWidth={device === 'desktop' ? 1200 : previewWidth}
            designHeight={device === 'mobile' ? 760 : 920}
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

/**
 * Gallery card.
 *
 * The preview is a real render of the template at a scaled design width, so the
 * card shows the actual design instead of an illustration. Premium templates
 * stay previewable; only "use" is gated (and the lock is enforced on the API).
 */
export default function TemplateCard({ template, locked = false, used = false, busy = false, onPreview, onUse }) {
  const isPremium = template.tier === 'premium';

  return (
    <article className="gallery-card group flex flex-col">
      <div className="gallery-preview">
        <TemplateThumb template={template} designHeight={640} />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {used ? (
            <span className="rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent-hover">
              In use
            </span>
          ) : null}
          {isPremium ? (
            <span className="badge-premium shadow-raised">
              {locked ? <Lock size={9} aria-hidden="true" /> : null}
              Premium
            </span>
          ) : (
            <span className="badge-free shadow-raised">Free</span>
          )}
        </div>

        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur-sm">
          {template.styleLabel}
        </span>

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-black/0 to-black/0 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="pointer-events-auto flex gap-2">
            <button
              type="button"
              onClick={() => onPreview?.(template)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[12px] font-semibold text-neutral-900 shadow-float transition hover:bg-white"
            >
              <Eye size={13} aria-hidden="true" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => onUse?.(template)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/95 px-3.5 py-2 text-[12px] font-semibold text-white shadow-float transition hover:bg-neutral-900 disabled:opacity-60"
            >
              {locked ? <Lock size={12} aria-hidden="true" /> : <ArrowUpRight size={13} aria-hidden="true" />}
              {locked ? 'Unlock' : 'Use'}
            </button>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{template.name}</h3>
            <p className="mt-0.5 truncate text-[11.5px] text-muted">
              {template.category} · {template.layoutLabel}
            </p>
          </div>
          <span className="flex shrink-0 gap-1 pt-1.5" aria-hidden="true">
            {template.swatches.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-2.5 w-2.5 rounded-full border border-black/10"
                style={{ background: color }}
              />
            ))}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-muted">{template.description}</p>

        <div className="mt-3.5 flex items-center gap-2 pt-1">
          <button type="button" onClick={() => onPreview?.(template)} className="btn-secondary btn-sm flex-1 justify-center">
            Preview
          </button>
          <button
            type="button"
            onClick={() => onUse?.(template)}
            disabled={busy}
            className={`btn-sm flex-1 justify-center ${locked ? 'btn-secondary' : 'btn-primary'}`}
          >
            {locked ? <Lock size={12} aria-hidden="true" /> : null}
            {busy ? 'Working…' : locked ? 'Unlock' : 'Use template'}
          </button>
        </div>
      </div>
    </article>
  );
}
