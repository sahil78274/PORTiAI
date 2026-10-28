import { env } from '../config/env.js';
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
 * There is no payment provider configured in this deployment, so the plan can
 * only be changed by an operator (`server/scripts/grant-premium.mjs`) or by a
 * signed billing webhook when one is configured. Nothing in the client grants
 * access, and no endpoint "activates" a subscription without verification.
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
      providerConfigured: Boolean(env.billing.webhookSecret),
      /** The API never impersonates a checkout: the client links to support/contact. */
      upgradePath: 'billing_webhook',
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
