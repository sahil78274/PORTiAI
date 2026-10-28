import { useEffect, useRef, useState } from 'react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../marketing/TemplatePreviewFrame.jsx';
import { demoPortfolioForTemplate } from '../../data/premiumDemo.js';
import { getStyle } from '../../data/templateStyles.js';

/** The template's own page colour, used as the matte behind its scaled clone. */
const backingFor = (template) => {
  if (!template) return 'var(--canvas-alt)';
  if (template.legacy) return template.appearance === 'dark' ? '#0a0a0b' : '#ffffff';
  try {
    return getStyle(template.style).preview[0];
  } catch {
    return 'var(--canvas-alt)';
  }
};

/**
 * A scaled live render of a template.
 *
 * Mounted only when it scrolls near the viewport, so a gallery of 100+ cards
 * never blocks first paint. The wrapper reserves the exact preview ratio, which
 * keeps the grid stable while previews load (no layout shift).
 */
export default function TemplateThumb({ template, designWidth = 1000, designHeight = 660, className = '', priority = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(priority);

  useEffect(() => {
    if (visible) return undefined;
    const element = ref.current;
    if (!element) return undefined;
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
      { rootMargin: '320px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className} style={{ aspectRatio: `${designWidth} / ${designHeight}` }}>
      {visible ? (
        <TemplatePreviewFrame
          designWidth={designWidth}
          designHeight={designHeight}
          label={`${template.name} template preview`}
          background={backingFor(template)}
          crop
        >
          <PortfolioRenderer portfolio={demoPortfolioForTemplate(template)} />
        </TemplatePreviewFrame>
      ) : (
        <div
          className="skeleton h-full w-full"
          style={{ borderRadius: 0, aspectRatio: `${designWidth} / ${designHeight}` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
