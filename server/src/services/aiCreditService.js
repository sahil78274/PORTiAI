import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { resolveEntitlements } from './subscriptionService.js';

/**
 * Monthly AI Project Builder credits.
 *
 * Credits exist to keep provider costs bounded. The allowance resets at the
 * start of each calendar month (UTC). Consumption is a single atomic update
 * guarded by `used < limit`, so parallel requests cannot overspend; a failed
 * generation refunds the credit.
 */

const startOfMonth = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));

const startOfNextMonth = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));

const planLimit = (user) => (resolveEntitlements(user).isPremium ? env.ai.projectCreditsMonthly : 0);

/**
 * Ensures the stored allowance belongs to the current month.
 * Returns the (possibly updated) user document.
 */
export const ensureCreditPeriod = async (user) => {
  const now = new Date();
  const periodStart = startOfMonth(now);
  const periodEnd = startOfNextMonth(now);
  const limit = planLimit(user);

  const stale =
    !user.aiCredits?.periodStart ||
    new Date(user.aiCredits.periodStart).getTime() !== periodStart.getTime() ||
    (user.aiCredits?.periodEnd && new Date(user.aiCredits.periodEnd).getTime() <= now.getTime()) ||
    user.aiCredits?.limit !== limit;

  if (!stale) return user;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        'aiCredits.limit': limit,
        'aiCredits.used': 0,
        'aiCredits.periodStart': periodStart,
        'aiCredits.periodEnd': periodEnd,
      },
    }
  );
  user.aiCredits = { limit, used: 0, periodStart, periodEnd };
  return user;
};

/** Current credit balance, creating the period if needed. */
export const getAiCredits = async (user) => {
  const fresh = await User.findById(user._id);
  if (!fresh) throw ApiError.unauthorized('Account no longer exists.');
  await ensureCreditPeriod(fresh);
  const stored = await User.findById(user._id).select('aiCredits plan premiumUntil premiumSince premiumSource').lean();
  const limit = stored?.aiCredits?.limit ?? 0;
  const used = stored?.aiCredits?.used ?? 0;
  return {
    plan: resolveEntitlements(stored).plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart: stored?.aiCredits?.periodStart || null,
    periodEnd: stored?.aiCredits?.periodEnd || null,
  };
};

/**
 * Atomically takes one credit. Throws 429 `AI_CREDITS_EXHAUSTED` when the
 * allowance is used up, before any provider request is made.
 */
export const consumeAiCredit = async (user) => {
  await ensureCreditPeriod(user);

  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      $expr: { $and: [{ $lt: ['$aiCredits.used', '$aiCredits.limit'] }, { $gt: ['$aiCredits.limit', 0] }] },
    },
    { $inc: { 'aiCredits.used': 1 } },
    { new: true }
  );

  if (!updated) {
    const credits = await getAiCredits(user);
    throw ApiError.withCode(
      429,
      'AI_CREDITS_EXHAUSTED',
      `You have used all ${credits.limit} AI project credits for ${credits.periodEnd ? new Date(credits.periodEnd).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'this month'}. Credits reset on the 1st. You can still edit, download and reuse projects you have already generated.`
    );
  }

  return {
    limit: updated.aiCredits.limit,
    used: updated.aiCredits.used,
    remaining: Math.max(0, updated.aiCredits.limit - updated.aiCredits.used),
    periodStart: updated.aiCredits.periodStart,
    periodEnd: updated.aiCredits.periodEnd,
  };
};

/** Returns a credit when a generation fails for a reason other than the limit. */
export const refundAiCredit = async (userId) => {
  await User.updateOne(
    { _id: userId, 'aiCredits.used': { $gt: 0 } },
    { $inc: { 'aiCredits.used': -1 } }
  );
};
