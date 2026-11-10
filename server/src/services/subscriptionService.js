import { env, isCheckoutConfigured, isDevUpgradeEnabled, isRazorpayConfigured, isRazorpayWebhookConfigured } from '../config/env.js';
import { getPricing } from '../config/pricing.js';
import { ApiError } from '../utils/ApiError.js';
import { PREMIUM_TEMPLATE_IDS, FREE_TEMPLATE_IDS, TEMPLATE_IDS } from '../utils/portfolioDefaults.js';

/**
 * Premium entitlement.
 *
 * The server is the only authority: `resolveEntitlements` reads the user's
 * plan from the database and checks the expiry date. The browser may cache the
 * result, but every premium action (creating or updating a portfolio with a
 * premium template, generating an AI project) is re-checked here.
 *
 * A plan changes only in these server-side ways:
 *   1. a verified Razorpay checkout (HMAC signature + provider amount check),
 *   2. a verified Razorpay webhook (`RAZORPAY_WEBHOOK_SECRET`),
 *   3. a development-only upgrade (`BILLING_DEV_UPGRADE`, never in production),
 *   4. an operator grant (`server/scripts/grant-premium.mjs`).
 *
 * Nothing in the client grants access, and no endpoint "activates" a
 * subscription without one of those server-side paths.
 */
const FREE_PLAN_LABEL = 'Free';
const PREMIUM_PLAN_LABEL = 'Premium';

const isExpired = (until) => Boolean(until && new Date(until).getTime() <= Date.now());

/** How an upgrade can happen on this deployment. */
export const upgradePath = () => {
  if (isRazorpayConfigured()) return 'razorpay';
  if (isCheckoutConfigured()) return 'checkout';
  if (isDevUpgradeEnabled()) return 'development';
  return 'operator';
};

/**
 * @param {object} user               Mongoose user document (or plain object)
 * @param {object|null} subscription  Subscription document, when loaded
 */
export const resolveEntitlements = (user, subscription = null) => {
  const onPremiumPlan = user?.plan === 'premium';
  const expired = isExpired(user?.premiumUntil);
  const isPremium = onPremiumPlan && !expired;
  const pricing = getPricing();

  const periodOver =
    Boolean(subscription?.currentPeriodEnd) && new Date(subscription.currentPeriodEnd).getTime() <= Date.now();
  const status = !subscription
    ? isPremium
      ? 'active'
      : expired
        ? 'expired'
        : 'free'
    : !isPremium && periodOver && ['active', 'pending', 'cancelled', 'failed'].includes(subscription.status)
      ? 'expired'
      : subscription.status;

  return {
    plan: isPremium ? 'premium' : 'free',
    isPremium,
    label: isPremium ? PREMIUM_PLAN_LABEL : FREE_PLAN_LABEL,
    premiumSince: user?.premiumSince ? new Date(user.premiumSince).toISOString() : null,
    premiumUntil: user?.premiumUntil ? new Date(user.premiumUntil).toISOString() : null,
    expired: onPremiumPlan && expired,
    source: user?.premiumSource || 'none',
    /** Billing status: active, pending, failed, cancelled, expired or free. */
    status,
    interval: subscription?.interval || null,
    cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
    cancelEffectiveAt: subscription?.cancelEffectiveAt || (subscription?.cancelAtPeriodEnd ? subscription?.currentPeriodEnd || null : null),
    introOfferUsed: Boolean(subscription?.introOfferUsed),
    /** The first-month offer is available to accounts that have never used it. */
    introEligible: !subscription?.introOfferUsed,
    renewal: {
      /** Only a live Razorpay mandate with no cancellation renews automatically. */
      willRenew: Boolean(isPremium && subscription?.providerSubscriptionId && !subscription?.cancelAtPeriodEnd),
      nextChargeAt: isPremium && !subscription?.cancelAtPeriodEnd ? subscription?.currentPeriodEnd || null : null,
      interval: subscription?.interval || null,
      amount: subscription?.amount || 0,
    },
    pricingSummary: {
      monthly: { amount: pricing.monthly.amount, display: pricing.monthly.display, introAmount: pricing.monthly.introAmount, introDisplay: pricing.monthly.introDisplay },
      yearly: { amount: pricing.yearly.amount, display: pricing.yearly.display, originalDisplay: pricing.yearly.originalDisplay, savingPercent: pricing.yearly.savingPercent },
      currency: pricing.currency,
    },
    templates: {
      total: TEMPLATE_IDS.length,
      free: FREE_TEMPLATE_IDS.length,
      premium: PREMIUM_TEMPLATE_IDS.length,
      accessible: isPremium ? TEMPLATE_IDS.length : FREE_TEMPLATE_IDS.length,
    },
    billing: {
      /** Razorpay credentials are present, so paid plans can be purchased. */
      razorpayConfigured: isRazorpayConfigured(),
      /** Webhook signatures can be verified on this deployment. */
      webhookConfigured: isRazorpayWebhookConfigured(),
      /** A legacy hosted checkout URL is configured. */
      checkoutConfigured: isCheckoutConfigured(),
      /** Provider callback configured (legacy flag kept for older clients). */
      providerConfigured: Boolean(env.billing.webhookSecret) || isRazorpayWebhookConfigured(),
      /** Development only: POST /subscription/checkout activates instantly. */
      devUpgradeEnabled: isDevUpgradeEnabled(),
      /**
       * `razorpay`   → Razorpay Checkout, plan confirmed server-side
       * `checkout`   → redirect to a hosted checkout, plan confirmed by webhook
       * `development`→ immediate server-side activation (non-production only)
       * `operator`   → no self-service path; the PortiAI team provisions it
       */
      upgradePath: upgradePath(),
      paymentRequired: Boolean(isRazorpayConfigured() || isCheckoutConfigured()),
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

/** Throws 403 PREMIUM_REQUIRED for premium-only features (AI Project Builder). */
export const assertPremiumAccess = (user, message) => {
  if (isPremiumUser(user)) return;
  throw ApiError.premiumRequired(
    message ||
      'The AI Project Builder is part of PortiAI Premium. Upgrade to generate real projects and add them to your portfolio.'
  );
};

/**
 * Applies a paid plan to the user document.
 *
 * `months` is the length of the billing period; `source` records how the plan
 * was granted (`billing` for a verified payment, `dev` for the development-only
 * switch) so support can tell them apart later.
 */
export const activatePremium = async (user, { months = 1, source = 'billing', until = null } = {}) => {
  const end = until ? new Date(until) : new Date();
  if (!until) end.setMonth(end.getMonth() + months);

  // Never shorten access that is already paid for: this makes late or
  // out-of-order webhooks safe.
  const existing = user.premiumUntil ? new Date(user.premiumUntil) : null;
  const finalEnd = existing && existing.getTime() > end.getTime() ? existing : end;

  user.plan = 'premium';
  user.premiumSince = user.premiumSince || new Date();
  user.premiumUntil = finalEnd;
  user.premiumSource = source;
  await user.save();
  return resolveEntitlements(user);
};

export { isExpired };
