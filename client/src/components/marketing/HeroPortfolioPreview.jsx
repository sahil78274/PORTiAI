import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { demoPortfolioForTemplate } from '../../data/premiumDemo.js';
import { getCatalogueTemplate } from '../../data/templateCatalogue.js';

/**
 * The portfolio preview beside the hero copy.
 *
 * It renders a real catalogue template with clearly-labelled sample content,
 * scaled down, so the hero shows the same component a published portfolio
 * uses — no hand-drawn mockup.
 */
export default function HeroPortfolioPreview({
  className = '',
  templateId = 'split-aurora-split',
  designWidth = 1120,
  designHeight = 600,
}) {
  const template = getCatalogueTemplate(templateId);

  return (
    <figure className={`overflow-hidden rounded-2xl border border-line bg-surface shadow-float ${className}`}>
      <div className="flex items-center gap-2 border-b border-line bg-canvasAlt px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            // Inline colour: opacity modifiers do not apply to CSS-variable tokens.
            <span key={dot} className="h-2 w-2 rounded-full" style={{ background: 'var(--line-strong)', opacity: 0.6 }} />
          ))}
        </span>
        <span className="mx-auto truncate rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[10px] text-faint">
          portiai.app/p/your-name
        </span>
        <span className="hidden rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-hover sm:block">
          {template?.name || 'Template'}
        </span>
      </div>

      <div className="bg-canvasDeep">
        <TemplatePreviewFrame
          designWidth={designWidth}
          designHeight={designHeight}
          label={`${template?.name || 'Portfolio'} template preview`}
          crop
        >
          <PortfolioRenderer portfolio={demoPortfolioForTemplate(template)} />
        </TemplatePreviewFrame>
      </div>
    </figure>
  );
}
