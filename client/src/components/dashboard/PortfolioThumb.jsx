import { getTemplate } from '../../utils/templates.js';

/**
 * Lightweight preview of a portfolio, drawn from its real template tone and
 * accent colour. List endpoints only return summary fields, so this sketches
 * the layout instead of rendering full content.
 *
 * The colours inside the frame intentionally belong to the portfolio's own
 * template (light or dark), not to the PortiAI product palette.
 *
 * size: 'sm' (list row) | 'md' (card)
 */
export default function PortfolioThumb({ portfolio, size = 'md', className = '' }) {
  const template = getTemplate(portfolio.templateId);
  const accent = portfolio.accent || template.accent;
  const light = template.tone === 'light';
  const page = light ? '#ffffff' : '#15181e';
  const ink = light ? '#1a1f2b' : '#f3f4f6';
  const soft = light ? '#eef0f5' : 'rgba(255,255,255,0.08)';

  if (size === 'sm') {
    return (
      <div className={`shrink-0 rounded-[12px] bg-surface p-1 shadow-neu-sm ${className}`} aria-hidden="true">
        <div className="h-12 w-16 overflow-hidden rounded-[9px]" style={{ background: page }}>
          <div className="h-1" style={{ background: accent }} />
          <div className="space-y-1 p-1.5">
            <div className="h-1 w-6 rounded-full" style={{ background: ink, opacity: 0.85 }} />
            <div className="h-[3px] w-9 rounded-full" style={{ background: accent }} />
            <div className="mt-1 grid grid-cols-2 gap-1">
              <div className="h-3 rounded-[3px]" style={{ background: soft }} />
              <div className="h-3 rounded-[3px]" style={{ background: soft }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[16px] bg-canvas p-2 shadow-neu-inset-sm ${className}`} aria-hidden="true">
      <div className="overflow-hidden rounded-[11px] shadow-neu-xs" style={{ background: page }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ background: light ? '#f4f5f9' : '#1d2129' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: light ? '#d5d9e4' : '#3a404c' }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: light ? '#d5d9e4' : '#3a404c' }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: light ? '#d5d9e4' : '#3a404c' }} />
          <span className="ml-2 h-1.5 w-16 rounded-full" style={{ background: light ? '#e3e6ee' : '#2a2f39' }} />
        </div>
        <div className="aspect-[16/8] space-y-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-2 w-14 rounded-full" style={{ background: ink, opacity: 0.85 }} />
            <div className="flex gap-1.5">
              <div className="h-1 w-5 rounded-full" style={{ background: soft }} />
              <div className="h-1 w-5 rounded-full" style={{ background: soft }} />
              <div className="h-1 w-5 rounded-full" style={{ background: soft }} />
            </div>
          </div>
          <div className="pt-1.5">
            <div className="h-2.5 w-3/5 rounded-full" style={{ background: ink, opacity: 0.9 }} />
            <div className="mt-1.5 h-1.5 w-2/5 rounded-full" style={{ background: accent }} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1.5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-8 rounded-[5px]" style={{ background: soft }}>
                <div className="m-1.5 h-1 w-1/2 rounded-full" style={{ background: index === 0 ? accent : ink, opacity: index === 0 ? 1 : 0.35 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
