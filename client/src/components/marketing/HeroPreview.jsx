import { useState } from 'react';
import { Monitor, Smartphone, Sparkles, Check } from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { demoPortfolio } from '../../utils/demoPortfolio.js';
import { TEMPLATES, getTemplate } from '../../utils/templates.js';

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

  const templateObj = getTemplate(templateId);
  const portfolio = {
    ...demoPortfolio,
    templateId,
    theme: { ...demoPortfolio.theme, accent: templateObj.accent },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-surface shadow-float ring-1 ring-slate-900/5">
      {/* Window chrome / toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-slate-50/90 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 ring-1 ring-rose-500/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 ring-1 ring-amber-500/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 ring-1 ring-emerald-500/20" />
          </div>
          <div className="hidden h-3.5 w-px bg-slate-200 sm:block" />
          <span className="truncate font-mono text-2xs text-slate-500">
            portiai.app / editor <span className="text-slate-300">/</span> <strong className="font-semibold text-slate-700">{portfolio.title}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-medium text-emerald-700">
            <Check size={10} strokeWidth={2.5} aria-hidden="true" /> Saved
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* Editor sidebar controls */}
        <div className="hidden border-r border-line bg-surface p-4 lg:block">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-slate-400">Content editor</p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">Live</span>
          </div>

          <div className="mt-3.5 space-y-3">
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-700">Headline</span>
              <div className="rounded-lg border border-line bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-ink">
                {portfolio.profile.title}
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-700">Summary</span>
              <div className="rounded-lg border border-line bg-slate-50/50 px-2.5 py-1.5 text-xs leading-relaxed text-inkSoft">
                {portfolio.profile.summary}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Active Template</span>
              <div className="grid grid-cols-3 gap-1">
                {TEMPLATES.map((template) => {
                  const active = templateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTemplateId(template.id)}
                      aria-pressed={active}
                      className={`rounded-md border px-2 py-1.5 text-2xs font-medium transition-all duration-150 ${
                        active
                          ? 'border-accent bg-accent text-white shadow-xs'
                          : 'border-line bg-white text-slate-600 hover:border-lineStrong hover:bg-slate-50'
                      }`}
                    >
                      {template.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3 shadow-2xs">
              <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-indigo-700">
                <Sparkles size={11} aria-hidden="true" /> AI suggestions
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-slate-700">
                “Final-year BCA student building accessible React interfaces” is more concrete and recruiter-friendly than “passionate web developer”.
              </p>
            </div>
          </div>
        </div>

        {/* Live preview surface */}
        <div className="bg-slate-100/60 p-3 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-2xs font-semibold uppercase tracking-widest text-slate-500">Live preview</p>
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-2xs font-medium text-slate-600">
                {templateObj.name}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                aria-pressed={device === 'desktop'}
                aria-label="Desktop preview"
                className={`rounded-md p-1 transition-colors ${
                  device === 'desktop' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Monitor size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                aria-pressed={device === 'mobile'}
                aria-label="Mobile preview"
                className={`rounded-md p-1 transition-colors ${
                  device === 'mobile' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Smartphone size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className={`mx-auto overflow-hidden rounded-xl border border-line bg-white shadow-card transition-all duration-300 ${
              device === 'mobile' ? 'max-w-[320px]' : 'max-w-full'
            }`}
          >
            <TemplatePreviewFrame
              designWidth={device === 'mobile' ? 390 : 1080}
              designHeight={device === 'mobile' ? 640 : 580}
              label={`${templateId} template preview with sample content`}
            >
              <PortfolioRenderer portfolio={portfolio} />
            </TemplatePreviewFrame>
          </div>
          <p className="mt-2.5 text-center text-2xs text-slate-400">
            Interactive sample preview — switch templates above to see live changes.
          </p>
        </div>
      </div>
    </div>
  );
}
