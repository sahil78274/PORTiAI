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
export const PORTRAIT_SRC = '';
export const PORTRAIT_NAME = 'Farheen';
export const PORTRAIT_ROLE = 'Full Stack Developer';

export default function HeroPortrait({
  src = PORTRAIT_SRC,
  name = PORTRAIT_NAME,
  role = PORTRAIT_ROLE,
  className = '',
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <figure className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative">
        {/* Thin accent ring, offset so the circle never touches the ring itself. */}
        <span
          className="pointer-events-none absolute -inset-[10px] rounded-full border border-accent/50"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -inset-[3px] rounded-full border border-accent/25"
          aria-hidden="true"
        />

        <div className="relative h-[208px] w-[208px] overflow-hidden rounded-full border border-lineStrong bg-canvasAlt sm:h-[248px] sm:w-[248px] lg:h-[268px] lg:w-[268px]">
          {showImage ? (
            <img
              src={src}
              alt={`${name}, ${role}`}
              loading="eager"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center bg-canvasAlt"
              role="img"
              aria-label={`Portrait placeholder for ${name}, ${role}`}
            >
              <span className="text-[64px] font-semibold leading-none tracking-[-0.04em] text-inkSoft sm:text-[76px]">
                {name.slice(0, 1)}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
                {role}
              </span>
            </div>
          )}
        </div>
      </div>

      <figcaption className="mt-5">
        <p className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Hi, I&apos;m {name}</p>
        <p className="mt-0.5 text-[12px] text-muted">{role}</p>

      </figcaption>
    </figure>
  );
}
