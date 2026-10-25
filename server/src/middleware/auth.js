import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
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

  req.user = user;
  next();
});

/** Attaches req.user when a valid cookie exists, but never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.sessionSecret, { issuer: 'portiai' });
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (user && (user.tokenVersion ?? 0) === (payload.tv ?? 0)) req.user = user;
  } catch {
    /* ignore invalid token for optional routes */
  }
  next();
});
