import { useEffect, useRef, useState } from 'react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import { demoPortfolioFor } from '../../utils/demoPortfolio.js';

/**
 * A scaled live render of a template. Mounted only when it scrolls near the
 * viewport, so a gallery can show real layouts without blocking first paint.
 */
export default function TemplateThumb({ template, designWidth = 1000, designHeight = 660, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <TemplatePreviewFrame
          designWidth={designWidth}
          designHeight={designHeight}
          label={`${template.name} template preview`}
          crop
        >
          <PortfolioRenderer portfolio={demoPortfolioFor(template.id, template.accent)} />
        </TemplatePreviewFrame>
      ) : (
        <div className="skeleton w-full" style={{ aspectRatio: `${designWidth} / ${designHeight}` }} aria-hidden="true" />
      )}
    </div>
  );
}
