import { useState } from 'react';

/**
 * Circular portrait used in the landing hero.
 *
 * TO ADD THE REAL PHOTOGRAPH
 *   1. Drop the image in `client/public/` (for example `client/public/farheen.jpg`).
 *   2. Set PORTRAIT_SRC below to `'/farheen.jpg'`.
 * Nothing else needs to change: the circle keeps its size and the photograph is
 * cropped with `object-cover`, so any portrait-shaped photo works.
 *
 * While PORTRAIT_SRC is empty a neutral placeholder is shown. No generated or
 * stock face is ever substituted.
 */
export const PORTRAIT_SRC = '/images/farheen.png';
export const PORTRAIT_NAME = 'Farheen';
export const PORTRAIT_ROLE = 'Full Stack Developer';

export default function HeroPortrait({
  src = PORTRAIT_SRC,
  name = PORTRAIT_NAME,
  role = PORTRAIT_ROLE,
  className = '',
  compact = false,
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  const circle = compact
    ? 'h-[64px] w-[64px]'
    : 'h-[208px] w-[208px] sm:h-[248px] sm:w-[248px] lg:h-[268px] lg:w-[268px]';

  return (
    <figure className={`flex items-center ${compact ? 'gap-3.5 text-left' : 'flex-col text-center'} ${className}`}>
      {/* Raised soft ring with the photo recessed inside it. */}
      <div className={`shrink-0 rounded-full bg-surface shadow-neu ${compact ? 'p-1.5' : 'p-3'}`}>
        <div className={`relative overflow-hidden rounded-full bg-canvas shadow-neu-inset-sm ${circle}`}>
          {showImage ? (
            <img
              src={src}
              alt={`${name}, ${role}`}
              loading="eager"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover object-[center_35%]"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center bg-canvas"
              role="img"
              aria-label={`Portrait placeholder for ${name}, ${role}`}
            >
              <span className={`font-semibold leading-none tracking-[-0.04em] text-inkSoft ${compact ? 'text-[24px]' : 'text-[64px] sm:text-[76px]'}`}>
                {name.slice(0, 1)}
              </span>
            </div>
          )}
        </div>
      </div>

      <figcaption className={compact ? 'min-w-0' : 'mt-5'}>
        <p className={`font-semibold tracking-[-0.01em] text-ink ${compact ? 'text-[14px]' : 'text-[17px]'}`}>Hi, I&apos;m {name}</p>
        <p className="mt-0.5 text-[12px] text-muted">{role}</p>
      </figcaption>
    </figure>
  );
}
