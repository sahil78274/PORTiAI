import { useEffect, useRef, useState } from 'react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import { demoPortfolioForTemplate } from '../../data/premiumDemo.js';

const DEVICE_WIDTHS = { desktop: 1280, tablet: 834, mobile: 430 };

/**
 * Full-height live preview.
 *
 * The template is rendered at a desktop/tablet/mobile design width and scaled
 * to the container, with the wrapper height measured from the rendered content
 * so the whole page is visible (not just the first screen). This is the same
 * component tree a published portfolio uses.
 */
export default function TemplateLivePreview({ template, device = 'desktop', className = '' }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(720);
  const designWidth = DEVICE_WIDTHS[device] || DEVICE_WIDTHS.desktop;

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return undefined;

    const measure = () => {
      const nextScale = container.clientWidth / designWidth;
      setScale(nextScale);
      setHeight(Math.round(content.scrollHeight * nextScale));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, [designWidth, template?.id]);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
      <div
        ref={contentRef}
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        aria-hidden="true"
      >
        <PortfolioRenderer portfolio={demoPortfolioForTemplate(template)} />
      </div>
      <span className="sr-only">{template?.name} template, rendered at {device} width with sample content.</span>
    </div>
  );
}
