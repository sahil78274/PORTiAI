import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const handler = (_req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment and try again.',
    },
  });
};

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  // The API runs behind a single reverse proxy on Render/Vercel.
  validate: { trustProxy: false },
};

export const apiLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 300 });

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  // Per-account AI request ceiling (the provider has its own quota on top).
  limit: Number(process.env.AI_RATE_LIMIT_PER_MIN || 12),
  // Signed-in users are limited per account; anonymous callers per IP (IPv6-safe helper).
  keyGenerator: (req) => (req.user ? `user:${req.user._id}` : ipKeyGenerator(req.ip)),
});

export const publicLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 120 });

/** Website/file scans are capped per account so the API cannot be used as a proxy. */
export const scanLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => (req.user ? `user:${req.user._id}` : ipKeyGenerator(req.ip)),
});
