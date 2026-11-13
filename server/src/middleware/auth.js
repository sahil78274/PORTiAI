import jwt from 'jsonwebtoken';
import { env, isAdminEmail } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signSessionToken = (user) =>
  jwt.sign({ sub: user._id.toString(), tv: user.tokenVersion ?? 0 }, env.sessionSecret, {
    expiresIn: `${env.sessionDays}d`,
    issuer: 'portiai',
  });

export const cookieOptions = () => {
  const crossSite = env.isProduction;
  return {
    httpOnly: true,
    // The deployed API and frontend live on different sites, which requires
    // SameSite=None + Secure for the cookie to be sent cross-origin.
    sameSite: crossSite ? 'none' : 'lax',
    secure: crossSite,
    path: '/',
    maxAge: env.sessionDays * 24 * 60 * 60 * 1000,
  };
};

export const setSessionCookie = (res, token) => {
  res.cookie(env.cookieName, token, cookieOptions());
};

export const clearSessionCookie = (res) => {
  const { maxAge, ...rest } = cookieOptions();
  res.clearCookie(env.cookieName, rest);
};

/**
 * Resolves the signed-in user from the HTTP-only session cookie.
 * The token only identifies the user; ownership of every resource is still
 * checked against the database in the controllers.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.sessionSecret, { issuer: 'portiai' });
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) throw ApiError.unauthorized('Account no longer exists.');
  if ((user.tokenVersion ?? 0) !== (payload.tv ?? 0)) {
    throw ApiError.unauthorized('This session has been signed out. Please sign in again.');
  }
  // A suspended account loses access immediately, even with a live cookie.
  if (user.status === 'suspended') {
    throw ApiError.forbidden('This account has been suspended. Contact support if you believe this is a mistake.');
  }

  // ADMIN_EMAILS is an environment allow-list; promote the stored role once so
  // the admin panel is reachable even before the grant script is run.
  if (user.role !== 'admin' && isAdminEmail(user.email)) {
    user.role = 'admin';
    await User.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
  }

  req.user = user;
  next();
});

/**
 * Admin-only gate. Used after `requireAuth`, so `req.user` is a fresh database
 * document. A non-admin receives 403 — the API never relies on a hidden link.
 */
export const requireAdmin = (req, _res, next) => {
  if (req.user?.role === 'admin' || isAdminEmail(req.user?.email)) return next();
  return next(ApiError.forbidden('Administrator access is required for this resource.'));
};

/** Attaches req.user when a valid cookie exists, but never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.sessionSecret, { issuer: 'portiai' });
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (user && user.status !== 'suspended' && (user.tokenVersion ?? 0) === (payload.tv ?? 0)) req.user = user;
  } catch {
    /* ignore invalid token for optional routes */
  }
  next();
});
