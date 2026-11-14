import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TemplateThumb from '../templates/TemplateThumb.jsx';
import {
  HERO_FADE_MS,
  HERO_ROTATE_INTERVAL_MS,
  HERO_SLOT_COUNT,
  nextStep,
  stepCount,
  templateIndexFor,
} from '../../utils/heroShowcase.js';

const DESIGN_WIDTH = 820;
const DESIGN_HEIGHT = 1040;
const SLOTS = Array.from({ length: HERO_SLOT_COUNT }, (_, slot) => slot);

/**
 * The hero's template strip. Every second each slot cross-fades to its next
 * template, walking through the whole list and looping back to the start.
 *
 * The incoming preview fades in on top of the outgoing one, which stays fully
 * opaque underneath, so there is never a blank frame. The slot reserves a fixed
 * aspect ratio, so nothing around it moves.
 */
export default function HeroTemplateShowcase({ templates }) {
  const total = templates.length;
  const canRotate = stepCount(total) > 1;

  const rootRef = useRef(null);
  const [{ current, previous }, setSteps] = useState({ current: 0, previous: null });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  // Stop rotating while the hero is scrolled away or the tab is in the background.
  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      setInView(entries[entries.length - 1].isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  const running = canRotate && !hovered && !focused && inView && pageVisible;

  // The single rotation timer. It is cleared whenever rotation pauses or the
  // component unmounts, so two intervals can never run at once.
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSteps((steps) => ({ current: nextStep(steps.current, total), previous: steps.current }));
    }, HERO_ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [running, total]);

  if (!total) return null;

  return (
    <div
      ref={rootRef}
      className="grid w-full grid-cols-3 gap-2.5 lg:max-w-[520px]"
      // Mouse only: touch devices never send a matching "leave", which would leave the strip paused.
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {SLOTS.map((slot) => {
        const template = templates[templateIndexFor(current, slot, total)];
        if (!template) return null;
        const outgoing = previous === null ? null : templates[templateIndexFor(previous, slot, total)];
        const layers = outgoing && outgoing.id !== template.id ? [outgoing, template] : [template];

        return (
          <Link
            key={slot}
            to={`/templates/${template.id}`}
            className="group overflow-hidden rounded-md border border-line bg-surface transition-colors hover:border-lineStrong"
          >
            <div
              className="relative overflow-hidden border-b border-line"
              style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
            >
              {layers.map((layer) => {
                const incoming = layer === template && layers.length > 1;
                return (
                  <div
                    key={layer.id}
                    className={`absolute inset-0 ${incoming ? 'animate-fadeIn' : ''}`}
                    style={{
                      zIndex: layer === template ? 2 : 1,
                      animationDuration: incoming ? `${HERO_FADE_MS}ms` : undefined,
                      animationTimingFunction: incoming ? 'ease-in-out' : undefined,
                      willChange: incoming ? 'opacity' : undefined,
                    }}
                  >
                    <TemplateThumb template={layer} designWidth={DESIGN_WIDTH} designHeight={DESIGN_HEIGHT} priority />
                  </div>
                );
              })}
            </div>
            <span className="flex items-center justify-between gap-1 px-2 py-1.5">
              <span className="truncate text-[11px] font-medium text-inkSoft transition-colors group-hover:text-ink">
                {template.name}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-faint">
                {template.tier === 'free' ? 'Free' : 'Paid'}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
