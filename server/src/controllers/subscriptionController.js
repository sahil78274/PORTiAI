import crypto from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { env, isCheckoutConfigured, isDevUpgradeEnabled, checkoutUrlFor } from '../config/env.js';
import { isRazorpayConfigured } from '../config/env.js';
import { getPricing, priceForInterval } from '../config/pricing.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { activatePremium, resolveEntitlements } from '../services/subscriptionService.js';

/**
 * Legacy upgrade paths, kept so existing deployments and clients keep working.
 *
 * New purchases go through Razorpay (`billingController.js`). These two routes
 * remain for:
 *   - a development-only instant upgrade (`BILLING_DEV_UPGRADE`, never in
 *     production), used by the existing test suite and local demos;
 *   - a generic hosted checkout URL + shared-secret webhook
 *     (`BILLING_CHECKOUT_URL_*`, `BILLING_WEBHOOK_SECRET`) for deployments that
 *     already wired a provider before Razorpay support existed.
 *
 * When Razorpay is configured, the development switch is refused so a real
 * deployment can never hand out Premium for free.
 */

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
});

/** Records the development/legacy activation in the billing history too. */
const recordLocalSubscription = async (user, interval, months, provider = 'none') => {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + months);

  await Subscription.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        provider,
        status: 'active',
        interval,
        amount: Math.round((interval === 'yearly' ? getPricing().yearly.amount : getPricing().monthly.amount) * 100),
        currency: getPricing().currency,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: false,
        startedAt: now,
        note:
          provider === 'none'
            ? 'Activated on a development deployment without a payment provider.'
            : 'Activated by the billing provider webhook.',
      },
    },
    { upsert: true, new: true }
  ).catch(() => {});
};

/**
 * POST /api/subscription/checkout (legacy)
 *
 * With Razorpay configured this refuses, and the pricing page uses
 * `/subscription/razorpay/checkout` instead.
 */
export const startCheckout = asyncHandler(async (req, res) => {
  const { interval } = checkoutSchema.parse(req.body || {});
  const pricing = getPricing();

  if (isRazorpayConfigured()) {
    throw ApiError.withCode(
      409,
      'USE_RAZORPAY_CHECKOUT',
      'This deployment uses Razorpay. Start the upgrade from the pricing page, which creates a verified Razorpay order or subscription.'
    );
  }

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
        activation: 'webhook',
      },
    });
  }

  if (isDevUpgradeEnabled()) {
    const { months } = priceForInterval(interval);
    const subscription = await activatePremium(req.user, { months, source: 'dev' });
    await recordLocalSubscription(req.user, interval, months, 'none');
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
 * Billing webhook for a pre-Razorpay provider. Requires `BILLING_WEBHOOK_SECRET`
 * and returns 501 when no provider is wired up: the API never pretends a
 * payment succeeded.
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
    await user.save();
    await recordLocalSubscription(user, payload.interval || 'monthly', payload.interval === 'yearly' ? 12 : 1, 'none');
  } else {
    user.plan = 'free';
    user.premiumUntil = null;
    user.premiumSource = 'none';
    await user.save();
    await Subscription.updateOne(
      { userId: user._id },
      { $set: { status: 'cancelled', cancelAtPeriodEnd: true, note: 'Downgraded by the billing provider.' } }
    ).catch(() => {});
  }

  const subscription = await Subscription.findOne({ userId: user._id });
  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      subscription: resolveEntitlements(user, subscription),
      event: payload.event || 'manual.plan_change',
    },
  });
});
