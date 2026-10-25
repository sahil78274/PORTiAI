import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Monitor, Smartphone, Check } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import Modal from '../ui/Modal.jsx';
import { Button } from '../ui/Primitives.jsx';
import { TEMPLATES } from '../../utils/templates.js';
import { demoPortfolioFor } from '../../utils/demoPortfolio.js';

function PreviewDialog({ template, onClose }) {
  const [device, setDevice] = useState('desktop');
  if (!template) return null;
  const portfolio = demoPortfolioFor(template.id, template.accent);

  return (
    <Modal
      open={Boolean(template)}
      onClose={onClose}
      size="xl"
      title={`${template.name} — sample preview`}
      description="Rendered with sample content using the same template component the editor and public page use."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Link to={`/register?template=${template.id}`} className="btn-primary">
            Use this template
          </Link>
        </>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted">Sample content · template renders saved data</p>
        <div className="flex items-center gap-0.5 rounded border border-lineStrong bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            aria-pressed={device === 'desktop'}
            aria-label="Desktop preview"
            className={`rounded-sm p-1.5 ${device === 'desktop' ? 'bg-canvasAlt text-ink' : 'text-muted'}`}
          >
            <Monitor size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            aria-pressed={device === 'mobile'}
            aria-label="Mobile preview"
            className={`rounded-sm p-1.5 ${device === 'mobile' ? 'bg-canvasAlt text-ink' : 'text-muted'}`}
          >
            <Smartphone size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={`mx-auto overflow-hidden rounded border border-line bg-white ${device === 'mobile' ? 'max-w-[360px]' : ''}`}>
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

  return (
    <section id="templates" className="border-t border-line bg-canvasAlt/40 py-16 sm:py-20" aria-labelledby="templates-heading">
      <div className="container-page">
        {heading ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Templates</p>
              <h2 id="templates-heading" className="mt-2 text-2xl sm:text-3xl">
                Three layouts, one set of data
              </h2>
              <p className="mt-3 text-base leading-7 text-inkSoft">
                Switch templates at any point in the editor without re-entering your content. Each layout is built for a
                different audience.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary">
              Explore all templates
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {TEMPLATES.map((template) => (
            <article key={template.id} className="card flex flex-col overflow-hidden">
              <div className="border-b border-line bg-white">
                <TemplatePreviewFrame
                  designWidth={1120}
                  designHeight={620}
                  label={`${template.name} sample preview`}
                >
                  <PortfolioRenderer portfolio={demoPortfolioFor(template.id, template.accent)} />
                </TemplatePreviewFrame>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-[15px] font-semibold">{template.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{template.tagline}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {template.traits.map((trait) => (
                    <li key={trait} className="inline-flex items-center gap-1 rounded-sm border border-line bg-canvasAlt px-1.5 py-0.5 text-2xs text-inkSoft">
                      <Check size={10} aria-hidden="true" /> {trait}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Button variant="secondary" size="sm" onClick={() => setPreview(template)}>
                    <Eye size={13} aria-hidden="true" /> Preview
                  </Button>
                  <Link to={`/register?template=${template.id}`} className="btn-link text-xs">
                    Use template
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Previews use clearly marked sample content, not a real user&apos;s portfolio.</p>
      </div>

      <PreviewDialog template={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
