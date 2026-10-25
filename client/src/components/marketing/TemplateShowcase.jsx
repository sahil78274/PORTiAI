import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Monitor, Smartphone, Check, Sparkles } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import Modal from '../ui/Modal.jsx';
import { Button } from '../ui/Primitives.jsx';
import { TEMPLATES } from '../../utils/templates.js';
import { demoPortfolioFor } from '../../utils/demoPortfolio.js';
import { useAuth } from '../../context/AuthContext.jsx';

function PreviewDialog({ template, onClose, useUrl }) {
  const [device, setDevice] = useState('desktop');
  if (!template) return null;
  const portfolio = demoPortfolioFor(template.id, template.accent);
  const targetUrl = useUrl ? useUrl(template.id) : `/register?template=${template.id}`;

  return (
    <Modal
      open={Boolean(template)}
      onClose={onClose}
      size="xl"
      title={`${template.name} — interactive preview`}
      description="Rendered with sample content using the exact same template component the editor and public page use."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Link to={targetUrl} className="btn-primary">
            <span>Use this template</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </>
      }
    >
      <div className="mb-3.5 flex items-center justify-between">
        <p className="text-xs text-muted">Viewing: {template.name} · {template.bestFor}</p>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            aria-pressed={device === 'desktop'}
            aria-label="Desktop preview"
            className={`rounded-md p-1.5 transition-colors ${
              device === 'desktop' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Monitor size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            aria-pressed={device === 'mobile'}
            aria-label="Mobile preview"
            className={`rounded-md p-1.5 transition-colors ${
              device === 'mobile' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Smartphone size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className={`mx-auto overflow-hidden rounded-xl border border-line bg-white shadow-card transition-all duration-300 ${
          device === 'mobile' ? 'max-w-[360px]' : 'max-w-full'
        }`}
      >
        <TemplatePreviewFrame
          designWidth={device === 'mobile' ? 390 : 1120}
          designHeight={device === 'mobile' ? 1400 : 1350}
          label={`${template.name} full preview`}
        >
          <PortfolioRenderer portfolio={portfolio} />
        </TemplatePreviewFrame>
      </div>
    </Modal>
  );
}

export default function TemplateShowcase({ heading = true }) {
  const [preview, setPreview] = useState(null);
  const { user } = useAuth();
  const useUrl = (templateId) => (user ? `/dashboard/create?template=${templateId}` : `/register?template=${templateId}`);

  return (
    <section id="templates" className="border-t border-line bg-canvasAlt/30 py-16 sm:py-24" aria-labelledby="templates-heading">
      <div className="container-page">
        {heading ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Template Gallery</p>
              <h2 id="templates-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Three clean foundations for students and engineers
              </h2>
              <p className="mt-3 text-base leading-relaxed text-inkSoft">
                Every template is responsive, accessible and typographic. They share the same underlying data, so
                switching designs never loses content.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary">
              <span>View details</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {TEMPLATES.map((template) => (
            <article key={template.id} className="card-hover flex flex-col overflow-hidden bg-surface group">
              <div className="border-b border-line bg-slate-50/70 relative overflow-hidden">
                <TemplatePreviewFrame
                  designWidth={1120}
                  designHeight={620}
                  label={`${template.name} sample preview`}
                >
                  <PortfolioRenderer portfolio={demoPortfolioFor(template.id, template.accent)} />
                </TemplatePreviewFrame>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-ink">{template.name}</h3>
                  <span
                    className="h-3 w-3 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: template.accent }}
                    title={`Default accent: ${template.accent}`}
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{template.tagline}</p>
                <ul className="mt-3.5 flex flex-wrap gap-1.5">
                  {template.traits.map((trait) => (
                    <li
                      key={trait}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-slate-50 px-2 py-0.5 text-2xs font-medium text-slate-700"
                    >
                      <Check size={11} className="text-emerald-600" aria-hidden="true" /> {trait}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/80 pt-4 mt-5">
                  <Button variant="secondary" size="sm" onClick={() => setPreview(template)}>
                    <Eye size={13} aria-hidden="true" /> Preview
                  </Button>
                  <Link to={useUrl(template.id)} className="btn-link text-xs">
                    <span>Use template</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-center text-2xs text-slate-400">Previews render sample portfolio data with identical layout components.</p>
      </div>

      <PreviewDialog template={preview} onClose={() => setPreview(null)} useUrl={useUrl} />
    </section>
  );
}
