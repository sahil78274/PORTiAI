import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { heroPortfolio } from '../../utils/demoPortfolio.js';

/**
 * The portfolio preview beside the hero copy.
 *
 * It renders the real Minimal Developer template with clearly-labelled sample
 * content, scaled down, so what you see is the same component a published
 * portfolio uses — no hand-drawn mockup.
 */
export default function HeroPortfolioPreview({ className = '' }) {
  return (
    <figure className={`overflow-hidden rounded-lg border border-line bg-surface ${className}`}>
      <div className="flex items-center gap-2 border-b border-line bg-canvasAlt px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-lineStrong" />
          <span className="h-1.5 w-1.5 rounded-full bg-lineStrong" />
          <span className="h-1.5 w-1.5 rounded-full bg-lineStrong" />
        </span>
        <span className="mx-auto truncate rounded-sm border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-faint">
          portiai.app/p/alex-morgan
        </span>
      </div>

      <div className="bg-white">
        <TemplatePreviewFrame designWidth={1000} designHeight={560} label="Minimal Developer template preview" crop>
          <PortfolioRenderer portfolio={heroPortfolio} />
        </TemplatePreviewFrame>
      </div>
    </figure>
  );
}
