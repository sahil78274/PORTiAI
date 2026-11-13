import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveEntitlements } from '../services/subscriptionService.js';
import { getAiCredits } from '../services/aiCreditService.js';
import { isAdminEmail } from '../config/env.js';
import { signSessionToken, setSessionCookie } from '../middleware/auth.js';
import { logAdminAction } from '../services/adminAuditService.js';

const BCRYPT_ROUNDS = 12;

/**
 * Administrator authentication.
 *
 * The admin login reuses the exact same credential check as the normal
 * sign-in (bcrypt + the same generic error message), then verifies the
 * administrator role against the trusted database record. A valid
 * non-admin credential is rejected with 403 and no session cookie is set,
 * so the admin login page can never be used as a normal sign-in.
 */

const applyAdminAllowList = async (user) => {
  if (user.role !== 'admin' && isAdminEmail(user.email)) {
    user.role = 'admin';
    await User.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
  }
  return user;
};

/** POST /api/admin/login */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  const invalid = ApiError.unauthorized('Email or password is incorrect.');
  if (!user) {
    await bcrypt.compare(password, '$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsaltinva');
    throw invalid;
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw invalid;

  if (user.status === 'suspended') {
    throw ApiError.forbidden('This account has been suspended. Contact support if you believe this is a mistake.');
  }

  await applyAdminAllowList(user);

  if (user.role !== 'admin') {
    // Valid credentials, but not an administrator: no cookie is issued.
    throw ApiError.forbidden('This account does not have administrator access.');
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const token = signSessionToken(user);
  setSessionCookie(res, token);

  const subscription = await Subscription.findOne({ userId: user._id });
  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      subscription: resolveEntitlements(user, subscription),
      subscriptionRecord: subscription ? subscription.toOwnerJSON() : null,
      credits: await getAiCredits(user).catch(() => null),
    },
  });
});

/** GET /api/admin/me — administrator profile for the settings page. */
export const adminMe = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ userId: req.user._id });
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
      subscription: resolveEntitlements(req.user, subscription),
      subscriptionRecord: subscription ? subscription.toOwnerJSON() : null,
      credits: await getAiCredits(req.user).catch(() => null),
    },
  });
});

/**
 * PATCH /api/admin/me/password
 *
 * Secure password change: requires the current password, hashes with the
 * same bcrypt cost as registration, and bumps the token version so every
 * other session is signed out. The role can never be changed here.
 */
export const adminChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash +tokenVersion');
  if (!user) throw ApiError.unauthorized();

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest('Your current password is incorrect.');

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  // Re-issue a session for this device; other devices are signed out.
  setSessionCookie(res, signSessionToken(user));

  await logAdminAction(req, { action: 'admin.password_change', targetType: 'user', targetId: user._id.toString(), targetEmail: user.email });

  res.json({
    success: true,
    data: { user: user.toPublicJSON(), message: 'Password updated. Other devices have been signed out.' },
  });
});
