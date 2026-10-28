/**
 * CORS origin decision.
 *
 * Kept as a pure function so the allow-list can be reasoned about and tested
 * without booting an HTTP server: a rejected origin reaches the browser as an
 * opaque CORS failure, which makes production mistakes expensive to diagnose.
 *
 * Rules, in order:
 *  1. No Origin header (same-origin navigation, curl, health checks) → allowed.
 *  2. The origin is in the configured allow-list → allowed.
 *  3. Development → reflect the caller's origin (tunnels, hosted previews).
 *  4. Production + a Vercel preview origin when a Vercel app is configured → allowed.
 *  5. Otherwise → denied.
 */
export const isAllowedOrigin = (origin, { clientUrls = [], isProduction = true } = {}) => {
  if (!origin) return true;
  const normalised = origin.replace(/\/$/, '');
  if (clientUrls.includes(normalised)) return true;
  if (!isProduction) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(normalised) && clientUrls.some((url) => url.includes('.vercel.app'))) {
    return true;
  }
  return false;
};

export const normaliseOrigin = (origin) => (origin ? origin.replace(/\/$/, '') : origin);
