import crypto from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveEntitlements } from '../services/subscriptionService.js';

/** Plan copy shown on the marketing page and the upgrade dialog. */
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    cadence: 'forever',
    description: 'Everything you need to publish a first portfolio.',
    features: [
      'All six original templates',
      'Full editor, live previews and publishing',
      'Portfolio review and AI writing assistant',
      'One public portfolio link',
    ],
    limits: ['Premium catalogue is locked'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Contact us',
    cadence: 'per year',
    description: 'The complete PortiAI template catalogue and every layout style.',
    features: [
      'All 100 premium templates',
      'Ten layouts × ten visual styles',
      'New templates as they are released',
      'Everything included in Free',
    ],
    limits: [],
  },
];

export const getSubscription = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      subscription: resolveEntitlements(req.user),
      plans: PLANS,
    },
  });
});

const webhookSchema = z.object({
  event: z.string().max(60).optional(),
  email: z.string().trim().toLowerCase().email('A valid customer email is required.'),
  plan: z.enum(['free', 'premium']),
  premiumUntil: z.string().datetime().nullish(),
  source: z.string().max(40).optional(),
});

/**
 * Billing webhook.
 *
 * This is the only automated way a plan changes. It requires a shared secret
 * in `BILLING_WEBHOOK_SECRET` and returns 501 when no provider is wired up —
 * the API never pretends a payment succeeded.
 *
 * Expected payload (sent by the billing provider's server, never the browser):
 *   { "event": "invoice.paid", "email": "user@example.com", "plan": "premium",
 *     "premiumUntil": "2027-10-28T00:00:00.000Z" }
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
    user.premiumUntil = payload.premiumUntil ? new Date(payload.premiumUntil) : null;
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
