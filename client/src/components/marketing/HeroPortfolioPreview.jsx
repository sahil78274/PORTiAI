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
    <div className={`overflow-hidden rounded-[16px] bg-surface shadow-neu-sm ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-[7px] w-[7px] rounded-full bg-canvas shadow-neu-inset-xs" />
          <span className="h-[7px] w-[7px] rounded-full bg-canvas shadow-neu-inset-xs" />
          <span className="h-[7px] w-[7px] rounded-full bg-canvas shadow-neu-inset-xs" />
        </span>
        <span className="mx-auto rounded-full bg-canvas px-2.5 py-0.5 text-[9.5px] text-faint shadow-neu-inset-xs">
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
