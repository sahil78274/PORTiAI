import { useEffect, useRef, useState } from 'react';

/**
 * Renders a full portfolio template at a fixed design width and scales it down
 * to fit the container, so gallery previews match the real rendered output
 * (same template components, same data) instead of a hand-drawn mockup.
 */
export default function TemplatePreviewFrame({
  children,
  designWidth = 1120,
  designHeight = 780,
  className = '',
  label,
  crop = false,
  /** Backing colour behind the scaled clone; defaults to the app's muted canvas. */
  background = 'var(--canvas-alt)',
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const update = () => setScale(element.clientWidth / designWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: Math.round(designHeight * scale), background }}
      role="img"
      aria-label={label || 'Portfolio template preview'}
    >
      {/* The scaled clone is decorative: the frame exposes a single label instead,
          so the preview's own headings never pollute the page's heading outline. */}
      <div
        aria-hidden="true"
        style={{
          width: designWidth,
          height: crop ? designHeight : 'auto',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
