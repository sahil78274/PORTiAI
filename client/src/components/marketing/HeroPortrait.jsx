import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

/**
 * Portrait slot for the landing hero.
 *
 * TO ADD THE REAL PHOTOGRAPH
 *   1. Drop the image in `client/public/` (for example `client/public/hero-portrait.jpg`).
 *   2. Set PORTRAIT_SRC below to `'/hero-portrait.jpg'`.
 * Nothing else needs to change: the frame keeps its aspect ratio and the photo is
 * cropped to fill it with `object-cover`.
 *
 * While PORTRAIT_SRC is empty a neutral placeholder is shown, so the layout is
 * never filled with a stock or generated portrait.
 */
export const PORTRAIT_SRC = '';
export const PORTRAIT_ALT = 'Portrait photograph';

export default function HeroPortrait({ src = PORTRAIT_SRC, alt = PORTRAIT_ALT, className = '' }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <figure className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-line bg-surfaceHigh">
        <div className="aspect-[4/5] w-full">
          {showImage ? (
            <img
              src={src}
              alt={alt}
              loading="eager"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(45deg,#f2f2ed_0px,#f2f2ed_1px,transparent_1px,transparent_8px)]"
              role="img"
              aria-label="Placeholder for a profile photograph"
            >
              <ImageIcon size={20} className="text-faint" aria-hidden="true" />
              <span className="rounded border border-lineStrong bg-white px-2 py-0.5 text-[11px] font-medium text-muted">
                Profile photo
              </span>
            </div>
          )}
        </div>
      </div>
      {showImage ? null : (
        <figcaption className="mt-2 text-[11px] text-faint">
          Add your photograph at <code className="font-mono text-[10px] text-muted">client/public/</code> and set{' '}
          <code className="font-mono text-[10px] text-muted">PORTRAIT_SRC</code>.
        </figcaption>
      )}
    </figure>
  );
}
