import { z } from 'zod';
import { env, isRazorpayConfigured, isCheckoutConfigured, isDevUpgradeEnabled } from '../config/env.js';
import { getPricing } from '../config/pricing.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveEntitlements } from '../services/subscriptionService.js';
import { getAiCredits } from '../services/aiCreditService.js';
import {
  startCheckoutSession,
  createMandateSession,
  verifyCheckoutPayment,
  cancelUserSubscription,
  getCancellationPreview,
  getBillingOverview,
  getPaymentReceipt,
  expireDueSubscriptions,
  billingConfigured,
} from '../services/billingService.js';
import { PREMIUM_TEMPLATE_IDS, FREE_TEMPLATE_IDS, TEMPLATE_IDS } from '../utils/portfolioDefaults.js';

/**
 * Plans, subscription status and Razorpay checkout.
 *
 * Prices come from `config/pricing.js` only. The browser receives amounts for
 * display and Razorpay's public `key_id`; the key secret, webhook secret and all
 * entitlement decisions stay on the server.
 */

const FREE_FEATURES = [
  `All ${FREE_TEMPLATE_IDS.length} original templates`,
  'Full editor, live previews and publishing',
  'Portfolio review and AI writing assistant',
  'One public portfolio link and the blog',
];

const PREMIUM_FEATURES = [
  `All ${PREMIUM_TEMPLATE_IDS.length} premium templates (${TEMPLATE_IDS.length} designs in total)`,
  'AI Project Builder with real, downloadable source code',
  'Generate full-stack projects and add them to any portfolio',
  'Project screenshots and thumbnails in every template',
  'Everything included in Free',
];

const buildPlans = () => {
  const pricing = getPricing();
  const common = {
    currency: pricing.currency,
    features: PREMIUM_FEATURES,
  };

  return [
    {
      id: 'free',
      name: 'Free',
      amount: 0,
      price: 'Free',
      display: 'Free',
      cadence: 'forever',
      interval: null,
      description: 'Everything you need to publish a first portfolio.',
      features: FREE_FEATURES,
      limits: ['Premium templates are locked', 'AI Project Builder is not included'],
    },
    {
      ...common,
      id: 'monthly',
      name: 'Monthly',
      amount: pricing.monthly.amount,
      price: pricing.monthly.display,
      display: pricing.monthly.display,
      cadence: 'per month',
      interval: 'monthly',
      recurring: true,
      introAmount: pricing.monthly.introAmount,
      introDisplay: pricing.monthly.introDisplay,
      introLabel: 'first month',
      description: `Start for ${pricing.monthly.introDisplay}, then ${pricing.monthly.display} per month.`,
      disclosure: pricing.monthly.disclosure,
      limits: ['Renews automatically until cancelled'],
    },
    {
      ...common,
      id: 'yearly',
      name: 'Yearly',
      amount: pricing.yearly.amount,
      price: pricing.yearly.display,
      display: pricing.yearly.display,
      cadence: 'per year',
      interval: 'yearly',
      recurring: true,
      originalAmount: pricing.yearly.originalAmount,
      originalDisplay: pricing.yearly.originalDisplay,
      saving: pricing.yearly.saving,
      savingPercent: pricing.yearly.savingPercent,
      description: `Save ${pricing.yearly.saving} a year (${pricing.yearly.savingPercent}% off ${pricing.yearly.originalDisplay}).`,
      disclosure: pricing.yearly.disclosure,
      limits: ['Renews automatically until cancelled'],
    },
  ];
};

const billingBlock = () => ({
  razorpayConfigured: isRazorpayConfigured(),
  webhookConfigured: Boolean(env.razorpay.webhookSecret),
  checkoutConfigured: isCheckoutConfigured(),
  devUpgradeEnabled: isDevUpgradeEnabled(),
  paymentRequired: isRazorpayConfigured() || isCheckoutConfigured(),
  upgradePath: isRazorpayConfigured()
    ? 'razorpay'
    : isCheckoutConfigured()
      ? 'checkout'
      : isDevUpgradeEnabled()
        ? 'development'
        : 'operator',
});

const buildCatalogue = () => ({
  plans: buildPlans(),
  pricing: getPricing(),
  billing: billingBlock(),
});

/** GET /api/subscription/plans — public. No session required. */
export const getPlans = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: buildCatalogue() });
});

/**
 * GET /api/subscription — entitlements for the signed-in user.
 * Runs the expiry sweep first so a lapsed plan is never reported as active.
 */
export const getSubscription = asyncHandler(async (req, res) => {
  await expireDueSubscriptions({ limit: 50 }).catch(() => {});
  const subscription = await Subscription.findOne({ userId: req.user._id });
  const user = req.user;

  res.json({
    success: true,
    data: {
      subscription: resolveEntitlements(user, subscription),
      subscriptionRecord: subscription ? subscription.toOwnerJSON() : null,
      credits: await getAiCredits(user),
      ...buildCatalogue(),
    },
  });
});

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
  idempotencyKey: z.string().trim().max(100).optional().default(''),
});

/**
 * POST /api/subscription/razorpay/checkout
 *
 * Creates a Razorpay order (₹9 first month) or subscription (₹299/month after
 * the first month, or ₹3,050/year) and returns what Checkout.js needs. The plan
 * is NOT activated here.
 */
export const razorpayCheckout = asyncHandler(async (req, res) => {
  const { interval, idempotencyKey } = checkoutSchema.parse(req.body || {});
  const session = await startCheckoutSession(req.user, { interval, idempotencyKey });

  // The response of `already_active` needs the current entitlements; every
  // other mode is a payment session only.
  const subscription = await Subscription.findOne({ userId: req.user._id });
  res.json({
    success: true,
    data: {
      ...session,
      entitlements: resolveEntitlements(req.user, subscription),
      paymentConfigured: billingConfigured(),
    },
  });
});

const verifySchema = z.object({
  paymentRecordId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid payment record.'),
  razorpay_payment_id: z.string().trim().min(4).max(120),
  razorpay_order_id: z.string().trim().max(120).optional(),
  razorpay_subscription_id: z.string().trim().max(120).optional(),
  razorpay_signature: z.string().trim().min(16).max(200),
});

/**
 * POST /api/subscription/razorpay/verify
 *
 * Verifies the Checkout.js signature, fetches the payment from Razorpay and
 * only then activates Premium. Re-sending the same callback is a no-op.
 */
export const razorpayVerify = asyncHandler(async (req, res) => {
  const payload = verifySchema.parse(req.body || {});
  const result = await verifyCheckoutPayment(req.user, payload);
  res.json({ success: true, data: result });
});

/** POST /api/subscription/razorpay/mandate — step 2 of the monthly flow. */
export const razorpayMandate = asyncHandler(async (req, res) => {
  const { idempotencyKey } = checkoutSchema.parse({ ...(req.body || {}), interval: 'monthly' });
  const session = await createMandateSession(req.user, { idempotencyKey });
  res.json({ success: true, data: session });
});

/** GET /api/subscription/history — subscription state + receipts. */
export const history = asyncHandler(async (req, res) => {
  await expireDueSubscriptions({ limit: 50 }).catch(() => {});
  const overview = await getBillingOverview(req.user);
  const cancellation = await getCancellationPreview(req.user);
  res.json({
    success: true,
    data: {
      ...overview,
      cancellation,
      credits: await getAiCredits(req.user),
      plans: buildPlans(),
      pricing: getPricing(),
      billing: billingBlock(),
    },
  });
});

/** GET /api/subscription/payments/:id — a single receipt. */
export const receipt = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { receipt: await getPaymentReceipt(req.user, req.params.id) } });
});

const cancelSchema = z.object({
  immediate: z.boolean().optional().default(false),
  reason: z.string().trim().max(300).optional().default(''),
});

/**
 * POST /api/subscription/cancel
 * Cancels at the end of the paid period by default, so Premium is not lost
 * mid-cycle. The response states the exact date access ends.
 */
export const cancel = asyncHandler(async (req, res) => {
  const { immediate, reason } = cancelSchema.parse(req.body || {});
  const result = await cancelUserSubscription(req.user, { immediate, reason });
  res.json({ success: true, data: { ...result, plans: buildPlans(), billing: billingBlock() } });
});

/* ------------------------------------------------------------- Webhook */

import crypto from 'node:crypto';
import { isRazorpayWebhookConfigured } from '../config/env.js';
import { verifyWebhookSignature } from '../services/razorpayClient.js';
import { processRazorpayWebhookEvent } from '../services/billingService.js';

/**
 * POST /api/subscription/webhook/razorpay
 *
 * Mounted with `express.raw` **before** the JSON body parser, because the HMAC
 * must be computed over the exact bytes Razorpay sent.
 *
 *  - invalid signature → 401, nothing is read from the payload
 *  - duplicate event id → 200 (already processed)
 *  - processed / ignored → 200 so Razorpay stops retrying
 *  - unexpected processing error → 500 so Razorpay retries; the event row is
 *    marked failed and a retry is allowed to run again
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  if (!isRazorpayWebhookConfigured()) {
    throw ApiError.serviceUnavailable(
      'Razorpay webhooks are not configured on this server. Set RAZORPAY_WEBHOOK_SECRET to verify them.',
      'WEBHOOK_NOT_CONFIGURED'
    );
  }

  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : '');
  if (!raw.length) throw ApiError.badRequest('Empty webhook body.');

  const signature = req.get('x-razorpay-signature') || '';
  const headerEventId = req.get('x-razorpay-event-id') || '';
  const payloadHash = crypto.createHash('sha256').update(raw).digest('hex');
  const eventId = headerEventId || payloadHash;

  const valid = verifyWebhookSignature(raw, signature);
  if (!valid) {
    await WebhookEvent.create({
      provider: 'razorpay',
      eventId: `${eventId}:invalid:${Date.now()}`,
      eventType: 'unknown',
      signatureValid: false,
      status: 'failed',
      payloadHash,
      error: 'Invalid signature',
    }).catch(() => {});
    throw ApiError.unauthorized('Invalid Razorpay webhook signature.');
  }

  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    throw ApiError.badRequest('Webhook body was not valid JSON.');
  }

  const eventType = String(payload?.event || 'unknown').slice(0, 100);

  let event = await WebhookEvent.findOne({ eventId });
  if (event && event.status !== 'failed') {
    return res.json({ success: true, data: { duplicate: true, eventId, status: event.status } });
  }
  if (event) {
    event.attempts += 1;
    event.signatureValid = true;
    event.status = 'received';
    await event.save();
  } else {
    try {
      event = await WebhookEvent.create({
        provider: 'razorpay',
        eventId,
        eventType,
        signatureValid: true,
        status: 'received',
        payloadHash,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.json({ success: true, data: { duplicate: true, eventId } });
      }
      throw error;
    }
  }

  try {
    const result = await processRazorpayWebhookEvent({ eventType, payload });
    event.eventType = eventType;
    event.status = result.status === 'processed' ? 'processed' : 'ignored';
    event.summary = `${result.kind || result.status}${result.reason ? ` — ${result.reason}` : ''}`.slice(0, 600);
    event.processedAt = new Date();
    await event.save();
    res.json({ success: true, data: { eventId, type: eventType, ...result } });
  } catch (error) {
    event.status = 'failed';
    event.error = String(error.message || 'Webhook processing failed').slice(0, 600);
    await event.save().catch(() => {});
    throw error;
  }
});

/** GET /api/subscription/webhooks — a small readiness summary (admin only). */
export const webhookSummary = asyncHandler(async (_req, res) => {
  const [received, failed, last] = await Promise.all([
    WebhookEvent.countDocuments({ status: { $in: ['processed', 'ignored'] } }),
    WebhookEvent.countDocuments({ status: 'failed' }),
    WebhookEvent.findOne().sort({ createdAt: -1 }).lean(),
  ]);
  res.json({
    success: true,
    data: {
      configured: isRazorpayWebhookConfigured(),
      processed: received,
      failed,
      lastEvent: last
        ? { eventType: last.eventType, status: last.status, receivedAt: last.createdAt, error: last.error || '' }
        : null,
      failedPayments: await Payment.countDocuments({ status: 'failed' }),
    },
  });
});
