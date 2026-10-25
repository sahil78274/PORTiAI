import { useState } from 'react';
import { Monitor, Smartphone, Sparkles, Check } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { demoPortfolio } from '../../utils/demoPortfolio.js';
import { TEMPLATES } from '../../utils/templates.js';

/**
 * Hero product preview.
 *
 * Built from the same template renderer and UI styles the real editor uses, with
 * sample content. The template switcher and the desktop/mobile toggle below are
 * genuinely interactive so the preview does not misrepresent the product.
 */
export default function HeroPreview() {
  const [templateId, setTemplateId] = useState('developer');
  const [device, setDevice] = useState('desktop');

  const portfolio = { ...demoPortfolio, templateId };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-raised">
      {/* Window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-canvasAlt/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lineStrong" aria-hidden="true" />
          <span className="h-2 w-2 rounded-full bg-lineStrong" aria-hidden="true" />
          <span className="truncate font-mono text-[11px] text-muted">portiai / editor — sample content</span>
        </div>
        <span className="hidden items-center gap-1 rounded-sm border border-success/25 bg-successSoft px-1.5 py-0.5 text-2xs font-medium text-success sm:inline-flex">
          <Check size={10} aria-hidden="true" /> Saved
        </span>
      </div>

      <div className="grid lg:grid-cols-[248px_1fr]">
        {/* Editor controls */}
        <div className="hidden border-r border-line bg-surface p-3 lg:block">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">Content</p>
          <div className="mt-2 space-y-2.5">
            <div>
              <span className="mb-1 block text-xs font-medium text-ink">Professional title</span>
              <div className="rounded border border-lineStrong bg-surface px-2 py-1.5 text-xs text-ink">
                {portfolio.profile.title}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-ink">Summary</span>
              <div className="rounded border border-lineStrong bg-surface px-2 py-1.5 text-xs leading-5 text-inkSoft">
                {portfolio.profile.summary}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-ink">Template</span>
              <div className="flex flex-wrap gap-1">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    aria-pressed={templateId === template.id}
                    className={`rounded-sm border px-1.5 py-1 text-2xs transition-colors ${
                      templateId === template.id
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-lineStrong bg-surface text-inkSoft hover:bg-canvasAlt'
                    }`}
                  >
                    {template.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded border border-accent-line bg-accent-soft p-2">
              <p className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-wide text-accent">
                <Sparkles size={10} aria-hidden="true" /> AI suggestion
              </p>
              <p className="mt-1 text-2xs leading-4 text-inkSoft">
                “Final-year BCA student building accessible React interfaces” is more specific than “passionate web
                developer”.
              </p>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-canvasAlt/40 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-2xs uppercase tracking-widest text-muted">Live preview</p>
            <div className="flex items-center gap-0.5 rounded border border-lineStrong bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                aria-pressed={device === 'desktop'}
                aria-label="Desktop preview"
                className={`rounded-sm p-1 ${device === 'desktop' ? 'bg-canvasAlt text-ink' : 'text-muted hover:text-ink'}`}
              >
                <Monitor size={12} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                aria-pressed={device === 'mobile'}
                aria-label="Mobile preview"
                className={`rounded-sm p-1 ${device === 'mobile' ? 'bg-canvasAlt text-ink' : 'text-muted hover:text-ink'}`}
              >
                <Smartphone size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className={`mx-auto overflow-hidden rounded border border-line bg-white ${device === 'mobile' ? 'max-w-[300px]' : ''}`}>
            <TemplatePreviewFrame
              designWidth={device === 'mobile' ? 390 : 1080}
              designHeight={device === 'mobile' ? 620 : 600}
              label={`${templateId} template preview with sample content`}
            >
              <PortfolioRenderer portfolio={portfolio} />
            </TemplatePreviewFrame>
          </div>
          <p className="mt-2 text-center text-2xs text-faint">Sample content — not a real user.</p>
        </div>
      </div>
    </div>
  );
}
