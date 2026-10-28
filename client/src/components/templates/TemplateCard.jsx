import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye, Lock, Maximize2, Monitor, Smartphone, Tablet } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import Modal from '../ui/Modal.jsx';
import TemplateThumb from './TemplateThumb.jsx';
import { demoPortfolioForTemplate } from '../../data/premiumDemo.js';
import { getStyle } from '../../data/templateStyles.js';

const DEVICE_WIDTHS = { desktop: 1280, tablet: 834, mobile: 430 };

/** Full-size preview dialog used by the gallery and the landing page. */
export function TemplatePreviewModal({ template, onClose, onUse, onCustomize, useLabel, locked = false, busy = false }) {
  const [device, setDevice] = useState('desktop');
  if (!template) return null;
  const portfolio = demoPortfolioForTemplate(template);
  const previewWidth = DEVICE_WIDTHS[device];
  const backing = template.legacy
    ? template.appearance === 'dark'
      ? '#0a0a0b'
      : '#ffffff'
    : getStyle(template.style).preview[0];
  const label = useLabel || (locked ? 'Unlock this template' : 'Use template');

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
          <span className={template.tier === 'free' ? 'badge-free' : 'badge-premium'}>{template.tier === 'free' ? 'Free' : 'Premium'}</span>
          <span>{template.category}</span>
          <span aria-hidden="true">·</span>
          <span>{template.styleLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{template.appearance === 'dark' ? 'Dark' : 'Light'}</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-canvas p-0.5" role="group" aria-label="Preview width">
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
              className={`rounded p-1.5 transition-colors ${device === id ? 'bg-surfaceRaised text-ink' : 'text-faint hover:text-ink'}`}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-canvas">
        <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-1.5 text-[11px] text-muted">
          <span className="font-medium text-inkSoft">{template.name}</span>
          <span className="capitalize">{device} preview · sample content</span>
        </div>
        <div className="mx-auto transition-[max-width] duration-200" style={{ maxWidth: device === 'desktop' ? '100%' : `${previewWidth}px` }}>
          <TemplatePreviewFrame
            designWidth={device === 'desktop' ? 1200 : previewWidth}
            designHeight={device === 'mobile' ? 760 : 920}
            label={`${template.name} preview at ${device} width`}
            background={backing}
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
 * Follows the reference card anatomy: a large, accurate preview on top, then
 * name, a metadata line (category · layout · style), a two-line description and
 * an always-visible action row. The preview is a real render of the template, so
 * the card shows the actual design rather than an illustration.
 */
export default function TemplateCard({ template, locked = false, used = false, busy = false, onPreview, onUse }) {
  const premium = template.tier === 'premium';

  return (
    <article className="gallery-card group flex flex-col">
      <Link
        to={`/templates/${template.id}`}
        className="block border-b border-line"
        aria-label={`Open the ${template.name} template preview`}
      >
        <div className="relative">
          <TemplateThumb template={template} designHeight={640} />
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <span className={premium ? 'badge-premium' : 'badge-free'}>{premium ? (locked ? 'Premium' : 'Premium') : 'Free'}</span>
            {premium && locked ? (
              <span className="inline-flex items-center gap-1 rounded border border-line bg-neutral-950/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-100">
                <Lock size={9} aria-hidden="true" />
                Locked
              </span>
            ) : null}
            {used ? (
              <span className="rounded border border-line bg-neutral-950/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-100">
                In use
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-[14px] font-semibold leading-5 tracking-[-0.01em] text-ink">
            <Link to={`/templates/${template.id}`} className="transition-colors hover:text-accent-hover">
              {template.name}
            </Link>
          </h3>
          <span className="flex shrink-0 gap-1 pt-1" aria-hidden="true">
            {template.swatches.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-2 w-2 rounded-full border border-black/20"
                style={{ background: color }}
              />
            ))}
          </span>
        </div>

        <p className="mt-1 truncate text-[11.5px] text-muted">
          {template.category} · {template.styleLabel}
        </p>

        <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-muted">{template.description}</p>

        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <button type="button" onClick={() => onPreview?.(template)} className="btn-secondary btn-sm flex-1 justify-center">
            <Eye size={12} aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => onUse?.(template)}
            disabled={busy}
            className={`btn-sm flex-1 justify-center ${locked ? 'btn-outline' : 'btn-primary'}`}
          >
            {locked ? <Lock size={12} aria-hidden="true" /> : <ArrowUpRight size={12} aria-hidden="true" />}
            {busy ? 'Working…' : locked ? 'Unlock' : 'Use template'}
          </button>
        </div>
      </div>
    </article>
  );
}
