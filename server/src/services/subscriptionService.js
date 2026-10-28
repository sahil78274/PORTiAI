import { env, isCheckoutConfigured, isDevUpgradeEnabled } from '../config/env.js';
import { getPricing } from '../config/pricing.js';
import { ApiError } from '../utils/ApiError.js';
import { PREMIUM_TEMPLATE_IDS, FREE_TEMPLATE_IDS, TEMPLATE_IDS } from '../utils/portfolioDefaults.js';

/**
 * Premium entitlement.
 *
 * The server is the only authority: `resolveEntitlements` reads the user's
 * plan from the database and checks the optional expiry date. The browser may
 * cache the result, but every premium action (creating or updating a portfolio
 * with a premium template) is re-checked here.
 *
 * A plan changes only in one of three server-side ways:
 *   1. a signed billing webhook after a real payment (`BILLING_WEBHOOK_SECRET`),
 *   2. a development-only upgrade (`BILLING_DEV_UPGRADE`, never in production),
 *   3. an operator grant (`server/scripts/grant-premium.mjs`).
 *
 * Nothing in the client grants access, and no endpoint "activates" a
 * subscription without one of those server-side paths.
 */
const FREE_PLAN_LABEL = 'Free';
const PREMIUM_PLAN_LABEL = 'Premium';

const isExpired = (until) => Boolean(until && new Date(until).getTime() <= Date.now());

export const resolveEntitlements = (user) => {
  const onPremiumPlan = user?.plan === 'premium';
  const expired = isExpired(user?.premiumUntil);
  const isPremium = onPremiumPlan && !expired;

  return {
    plan: isPremium ? 'premium' : 'free',
    isPremium,
    label: isPremium ? PREMIUM_PLAN_LABEL : FREE_PLAN_LABEL,
    premiumSince: user?.premiumSince ? new Date(user.premiumSince).toISOString() : null,
    premiumUntil: user?.premiumUntil ? new Date(user.premiumUntil).toISOString() : null,
    expired: onPremiumPlan && expired,
    source: user?.premiumSource || 'none',
    templates: {
      total: TEMPLATE_IDS.length,
      free: FREE_TEMPLATE_IDS.length,
      premium: PREMIUM_TEMPLATE_IDS.length,
      accessible: isPremium ? TEMPLATE_IDS.length : FREE_TEMPLATE_IDS.length,
    },
    billing: {
      /** A provider callback is configured, so paid plans can be verified. */
      providerConfigured: Boolean(env.billing.webhookSecret),
      /** A hosted checkout URL exists, so the Upgrade button can redirect. */
      checkoutConfigured: isCheckoutConfigured(),
      /** Development only: POST /subscription/checkout activates instantly. */
      devUpgradeEnabled: isDevUpgradeEnabled(),
      /**
       * How an upgrade can happen on this deployment:
       * `checkout`   → redirect to the provider, plan confirmed by the webhook
       * `development`→ immediate server-side activation (non-production only)
       * `operator`   → no self-service path; the PortiAI team provisions it
       */
      upgradePath: isCheckoutConfigured() ? 'checkout' : isDevUpgradeEnabled() ? 'development' : 'operator',
      paymentRequired: isCheckoutConfigured(),
    },
  };
};

export const isPremiumUser = (user) => resolveEntitlements(user).isPremium;

/** Throws a 403 PREMIUM_REQUIRED error when a premium design is requested. */
export const assertTemplateAccess = (user, templateId) => {
  if (!templateId) return;
  if (!PREMIUM_TEMPLATE_IDS.includes(templateId)) return;
  if (isPremiumUser(user)) return;
  throw ApiError.premiumRequired(
    'That template is part of PortiAI Premium. Upgrade your account, or start from one of the free templates.'
  );
};

/**
 * Applies a paid plan to the user document.
 *
 * `months` is the length of the billing period; `source` records how the plan
 * was granted (`billing` for a verified payment, `dev` for the development-only
 * switch) so support can tell them apart later.
 */
export const activatePremium = async (user, { months = 1, source = 'billing' } = {}) => {
  const until = new Date();
  until.setMonth(until.getMonth() + months);

  user.plan = 'premium';
  user.premiumSince = user.premiumSince || new Date();
  user.premiumUntil = until;
  user.premiumSource = source;
  await user.save();
  return resolveEntitlements(user);
};
