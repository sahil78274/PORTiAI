import crypto from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env, isCheckoutConfigured, isDevUpgradeEnabled, checkoutUrlFor } from '../config/env.js';
import { getPricing, priceForInterval } from '../config/pricing.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { activatePremium, resolveEntitlements } from '../services/subscriptionService.js';
import { PREMIUM_TEMPLATE_IDS, FREE_TEMPLATE_IDS, TEMPLATE_IDS } from '../utils/portfolioDefaults.js';

/**
 * Plan copy shown on the Premium page and the upgrade dialog.
 *
 * Prices come from `config/pricing.js`, never from this file, so there is one
 * place to change them. Amounts stay server-side; the client only renders what
 * the API returns.
 */
const buildPlans = () => {
  const pricing = getPricing();
  const premiumTemplateCount = PREMIUM_TEMPLATE_IDS.length;
  const freeTemplateCount = FREE_TEMPLATE_IDS.length;

  return [
    {
      id: 'free',
      name: 'Free',
      amount: 0,
      currency: pricing.currency,
      price: 'Free',
      cadence: 'forever',
      interval: null,
      description: 'Everything you need to publish a first portfolio.',
      features: [
        `All ${freeTemplateCount} original templates`,
        'Full editor, live previews and publishing',
        'Portfolio review and AI writing assistant',
        'One public portfolio link and the blog',
      ],
      limits: ['Premium catalogue is locked'],
    },
    {
      id: 'premium',
      name: 'Premium',
      amount: pricing.monthly.amount,
      currency: pricing.currency,
      price: pricing.monthly.display,
      cadence: pricing.monthly.cadenceLabel,
      interval: 'monthly',
      description: `The complete PortiAI template catalogue (${TEMPLATE_IDS.length} designs) and every layout style.`,
      features: [
        `All ${premiumTemplateCount} premium templates`,
        'Ten layouts × ten visual styles',
        'New templates as they are released',
        'Everything included in Free',
      ],
      limits: [],
      pricing: {
        monthly: { amount: pricing.monthly.amount, display: pricing.monthly.display, cadence: pricing.monthly.cadenceLabel },
        yearly: {
          amount: pricing.yearly.amount,
          display: pricing.yearly.display,
          cadence: pricing.yearly.cadenceLabel,
          saving: pricing.yearly.saving,
          savingPercent: pricing.yearly.savingPercent,
        },
        confirmed: pricing.confirmed,
        note: pricing.note,
      },
    },
  ];
};

/** Pricing + availability only. Safe to expose to signed-out visitors. */
const buildCatalogueConfig = () => {
  const pricing = getPricing();
  return {
    plans: buildPlans(),
    pricing,
    billing: {
      providerConfigured: Boolean(env.billing.webhookSecret),
      checkoutConfigured: isCheckoutConfigured(),
      devUpgradeEnabled: isDevUpgradeEnabled(),
      upgradePath: isCheckoutConfigured() ? 'checkout' : isDevUpgradeEnabled() ? 'development' : 'operator',
    },
  };
};

/** GET /api/subscription/plans — public pricing, no session required. */
export const getPlans = asyncHandler(async (req, res) => {
  res.json({ success: true, data: buildCatalogueConfig() });
});

export const getSubscription = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      subscription: resolveEntitlements(req.user),
      ...buildCatalogueConfig(),
    },
  });
});

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
});

/**
 * POST /api/subscription/checkout — the only user-initiated upgrade path.
 *
 * Three outcomes, all decided by the server:
 *
 *  1. `mode: "checkout"`  — a hosted checkout URL is configured. The browser is
 *     sent there; the plan is activated later by the signed webhook, never by
 *     this request and never by the return URL.
 *  2. `mode: "activated"` — development-only switch (`BILLING_DEV_UPGRADE`).
 *     The plan is written here and immediately re-read from the database.
 *  3. `503 BILLING_NOT_CONFIGURED` — neither exists, so nothing is pretended.
 */
export const startCheckout = asyncHandler(async (req, res) => {
  const { interval } = checkoutSchema.parse(req.body || {});
  const pricing = getPricing();

  if (isCheckoutConfigured()) {
    const url = checkoutUrlFor(interval);
    if (!url) {
      throw ApiError.serviceUnavailable(
        `Checkout for the ${interval} plan is not configured. Set BILLING_CHECKOUT_URL_${interval.toUpperCase()} on the server.`,
        'BILLING_NOT_CONFIGURED'
      );
    }
    return res.json({
      success: true,
      data: {
        mode: 'checkout',
        interval,
        amount: priceForInterval(interval).amount,
        currency: pricing.currency,
        url,
        /** Activation happens on the provider callback, not on the return URL. */
        activation: 'webhook',
      },
    });
  }

  if (isDevUpgradeEnabled()) {
    const { months } = priceForInterval(interval);
    const subscription = await activatePremium(req.user, { months, source: 'dev' });
    return res.json({
      success: true,
      data: {
        mode: 'activated',
        interval,
        activation: 'development',
        subscription,
        user: req.user.toPublicJSON(),
        message: 'Development mode: Premium was activated without a payment provider.',
      },
    });
  }

  throw ApiError.serviceUnavailable(
    'No payment provider is connected to this deployment yet, so Premium cannot be purchased here. Set BILLING_CHECKOUT_URL_MONTHLY/YEARLY (and BILLING_WEBHOOK_SECRET) to enable checkout, or ask the PortiAI team to activate the plan.',
    'BILLING_NOT_CONFIGURED'
  );
});

const webhookSchema = z.object({
  event: z.string().max(60).optional(),
  email: z.string().trim().toLowerCase().email('A valid customer email is required.'),
  plan: z.enum(['free', 'premium']),
  premiumUntil: z.string().datetime().nullish(),
  interval: z.enum(['monthly', 'yearly']).optional(),
  source: z.string().max(40).optional(),
});

/**
 * Billing webhook — a plan changes here only after a signed provider callback.
 *
 * It requires a shared secret in `BILLING_WEBHOOK_SECRET` and returns 501 when
 * no provider is wired up: the API never pretends a payment succeeded.
 *
 * Expected payload (sent by the billing provider's server, never the browser):
 *   { "event": "invoice.paid", "email": "user@example.com", "plan": "premium",
 *     "premiumUntil": "2027-10-28T00:00:00.000Z" }
 * `premiumUntil` may be replaced by `interval: "monthly" | "yearly"`.
 */
export const billingWebhook = asyncHandler(async (req, res) => {
  if (!env.billing.webhookSecret) {
    throw ApiError.notImplemented(
      'No billing provider is connected to this deployment. Premium plans are provisioned by the PortiAI team.'
    );
  }

  const provided = String(req.get('x-billing-secret') || '');
  const expected = env.billing.webhookSecret;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw ApiError.unauthorized('Invalid billing webhook signature.');
  }

  const payload = webhookSchema.parse(req.body || {});
  const user = await User.findOne({ email: payload.email });
  if (!user) throw ApiError.notFound('No PortiAI account uses that email address.');

  if (payload.plan === 'premium') {
    user.plan = 'premium';
    user.premiumSince = user.premiumSince || new Date();
    if (payload.premiumUntil) {
      user.premiumUntil = new Date(payload.premiumUntil);
    } else {
      const until = new Date();
      until.setMonth(until.getMonth() + (payload.interval === 'yearly' ? 12 : 1));
      user.premiumUntil = until;
    }
    user.premiumSource = 'billing';
  } else {
    user.plan = 'free';
    user.premiumUntil = null;
    user.premiumSource = 'none';
  }
  await user.save();

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      subscription: resolveEntitlements(user),
      event: payload.event || 'manual.plan_change',
    },
  });
});
