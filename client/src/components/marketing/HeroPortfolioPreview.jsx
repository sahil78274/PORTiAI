import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { heroPortfolio } from '../../utils/demoPortfolio.js';

/**
 * The compact portfolio preview that sits to the right of the hero copy.
 * It renders the real Minimal Developer template with sample content, scaled
 * down, so what you see is the same component a published portfolio uses.
 */
export default function HeroPortfolioPreview({ className = '' }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-line bg-surface shadow-float ${className}`}>
      <div className="flex items-center gap-2 border-b border-line bg-surfaceRaised px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-[6px] w-[6px] rounded-full bg-lineStrong" />
          <span className="h-[6px] w-[6px] rounded-full bg-lineStrong" />
          <span className="h-[6px] w-[6px] rounded-full bg-lineStrong" />
        </span>
        <span className="mx-auto rounded border border-line bg-canvasAlt px-2 py-px text-[9.5px] text-faint">
          farheen · Minimal Developer
        </span>
      </div>

      <div className="bg-white">
        <TemplatePreviewFrame designWidth={1000} designHeight={560} label="Minimal Developer template preview" crop>
          <PortfolioRenderer portfolio={heroPortfolio} />
        </TemplatePreviewFrame>
      </div>
    </div>
  );
}
