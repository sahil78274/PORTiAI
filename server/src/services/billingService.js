import crypto from 'node:crypto';
import { env, isRazorpayConfigured } from '../config/env.js';
import { getPricing, toMinorUnits } from '../config/pricing.js';
import { BillingPlan } from '../models/BillingPlan.js';
import { Payment } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { activatePremium, resolveEntitlements } from './subscriptionService.js';
import * as razorpay from './razorpayClient.js';

/**
 * Subscription billing.
 *
 * Flow for the monthly plan:
 *   1. A one-time ₹9 order is created server-side and paid with Razorpay
 *      Checkout. The signature is verified and Razorpay is asked for the real
 *      payment before one month of Premium is written to the database.
 *   2. Immediately afterwards a ₹299/month Razorpay Subscription is created
 *      with `start_at` set to the end of that first month. Opening its checkout
 *      authorises the recurring mandate — this is the user's explicit recurring
 *      authorisation. The mandate is only charged when it starts, so the ₹9
 *      month is never charged twice.
 *
 * Yearly is a single ₹3,050/year Razorpay Subscription starting immediately.
 *
 * Nothing here trusts the browser: amounts come from `config/pricing.js`, every
 * provider response is fetched and compared with the stored payment, and a plan
 * is written only after a signature and an amount check have both passed.
 */

const MINIMUM_START_DELAY_MS = 15 * 60 * 1000;

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const fromUnix = (value) => (value ? new Date(Number(value) * 1000) : null);

const receiptNumber = () =>
  `PTI-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const amounts = () => {
  const pricing = getPricing();
  return {
    pricing,
    intro: toMinorUnits(pricing.monthly.introAmount),
    monthly: toMinorUnits(pricing.monthly.amount),
    yearly: toMinorUnits(pricing.yearly.amount),
    recurringFor: (interval) => (interval === 'yearly' ? toMinorUnits(pricing.yearly.amount) : toMinorUnits(pricing.monthly.amount)),
    monthsFor: (interval) => (interval === 'yearly' ? 12 : 1),
  };
};

export const billingConfigured = () => isRazorpayConfigured();

/* ------------------------------------------------------------ Documents */

/** Returns the single subscription document for a user, creating it if needed. */
export const ensureSubscription = async (user) => {
  const existing = await Subscription.findOne({ userId: user._id });
  if (existing) return existing;
  try {
    return await Subscription.create({
      userId: user._id,
      provider: 'razorpay',
      status: 'pending',
      currency: getPricing().currency,
    });
  } catch (error) {
    if (error.code === 11000) return Subscription.findOne({ userId: user._id });
    throw error;
  }
};

/** Billing page payload: subscription state + receipts. */
export const getBillingOverview = async (user) => {
  const [subscription, payments] = await Promise.all([
    Subscription.findOne({ userId: user._id }),
    Payment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50),
  ]);

  return {
    subscription: subscription ? subscription.toOwnerJSON() : null,
    entitlements: resolveEntitlements(user, subscription),
    payments: payments.map((payment) => payment.toReceiptJSON()),
  };
};

export const getPaymentReceipt = async (user, paymentId) => {
  if (!/^[a-f0-9]{24}$/i.test(String(paymentId))) throw ApiError.badRequest('That payment id is not valid.');
  const payment = await Payment.findOne({ _id: paymentId, userId: user._id });
  if (!payment) throw ApiError.notFound('Payment not found.');
  return payment.toReceiptJSON();
};

/* --------------------------------------------------------------- Plans */

const ensureRazorpayPlanId = async (interval) => {
  const fromEnv = interval === 'yearly' ? env.razorpay.planIdYearly : env.razorpay.planIdMonthly;
  if (fromEnv) return fromEnv;

  const { pricing } = amounts();
  const amount = amounts().recurringFor(interval);
  const currency = pricing.currency;

  const cached = await BillingPlan.findOne({ provider: 'razorpay', interval, amount, currency });
  if (cached) return cached.providerPlanId;

  const plan = await razorpay.createPlan({
    period: interval === 'yearly' ? 'yearly' : 'monthly',
    interval: 1,
    item: {
      name: interval === 'yearly' ? 'PortiAI Premium — Yearly' : 'PortiAI Premium — Monthly',
      amount,
      currency,
      description:
        interval === 'yearly'
          ? `PortiAI Premium, ${pricing.yearly.display} per year (renews annually).`
          : `PortiAI Premium, ${pricing.monthly.display} per month (renews monthly).`,
    },
    notes: { product: 'portiai-premium', interval },
  });

  try {
    await BillingPlan.create({ provider: 'razorpay', interval, providerPlanId: plan.id, amount, currency });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const raced = await BillingPlan.findOne({ provider: 'razorpay', interval, amount, currency });
    if (raced) return raced.providerPlanId;
  }
  return plan.id;
};

/** Finds or creates the Razorpay customer for an account. */
const ensureCustomerId = async (user) => {
  if (user.razorpayCustomerId) return user.razorpayCustomerId;
  const customer = await razorpay.ensureCustomer({ name: user.name, email: user.email });
  if (customer?.id) {
    await User.updateOne({ _id: user._id }, { $set: { razorpayCustomerId: customer.id } });
    user.razorpayCustomerId = customer.id;
  }
  return customer?.id || '';
};

/** Creates a Razorpay subscription. `startAt` is a Date; omit to charge now. */
const createProviderSubscription = async (user, { interval, startAt }) => {
  const planId = await ensureRazorpayPlanId(interval);
  const customerId = await ensureCustomerId(user);
  const totalCount = interval === 'yearly' ? env.razorpay.yearlyTotalCount : env.razorpay.monthlyTotalCount;

  const payload = {
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: 1,
    notes: { product: 'portiai-premium', interval, userId: user._id.toString() },
  };
  if (customerId) payload.customer_id = customerId;
  if (startAt) {
    const start = new Date(Math.max(startAt.getTime(), Date.now() + MINIMUM_START_DELAY_MS));
    payload.start_at = Math.floor(start.getTime() / 1000);
  }

  const subscription = await razorpay.createSubscription(payload);
  return { subscription, planId };
};

/* ------------------------------------------------------------ Checkout */

const normalizeIdempotencyKey = (user, key) => {
  if (!key) return '';
  const clean = String(key).trim().slice(0, 100);
  return clean ? `${user._id}:${clean}` : '';
};

/**
 * Starts a purchase for the signed-in user.
 *
 * Returns one of:
 *   { mode: 'razorpay_order',        orderId, amount, currency, keyId, paymentRecordId, … }
 *   { mode: 'razorpay_subscription', subscriptionId, amount, currency, keyId, paymentRecordId, … }
 *   { mode: 'already_active', … }  when a live recurring plan already exists
 *
 * The `*Id` values are Razorpay's own identifiers and are handed to Checkout.js.
 * The API key secret never leaves the server.
 */
export const startCheckoutSession = async (user, { interval = 'monthly', idempotencyKey = '' } = {}) => {
  if (!billingConfigured()) {
    throw ApiError.serviceUnavailable(
      'Online payments are not configured on this server yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the API environment to enable checkout.',
      'PAYMENT_NOT_CONFIGURED'
    );
  }

  const { pricing, intro, recurringFor, monthsFor } = amounts();
  const subscription = await ensureSubscription(user);
  const key = normalizeIdempotencyKey(user, idempotencyKey);

  /* Replay of the same request (double click / retry). */
  if (key) {
    const replay = await Payment.findOne({ userId: user._id, idempotencyKey: key });
    if (replay) {
      if (replay.status === 'captured') {
        return {
          mode: 'already_paid',
          payment: replay.toReceiptJSON(),
          entitlements: resolveEntitlements(user, subscription),
        };
      }
      return {
        mode: replay.providerSubscriptionId ? 'razorpay_subscription' : 'razorpay_order',
        paymentRecordId: replay._id.toString(),
        orderId: replay.providerOrderId || null,
        subscriptionId: replay.providerSubscriptionId || null,
        amount: replay.amount,
        currency: replay.currency,
        keyId: env.razorpay.keyId,
        interval,
        description: replay.description,
        prefill: { name: user.name, email: user.email },
        replayed: true,
      };
    }
  }

  /* A live recurring mandate already exists: do not charge twice. */
  if (subscription.providerSubscriptionId && subscription.status === 'pending' && interval === 'monthly' && subscription.introOfferUsed) {
    return createMandateSession(user, { idempotencyKey });
  }
  if (subscription.providerSubscriptionId && ['active', 'pending'].includes(subscription.status)) {
    return {
      mode: 'already_active',
      interval: subscription.interval,
      subscription: subscription.toOwnerJSON(),
      entitlements: resolveEntitlements(user, subscription),
      message:
        'You already have a recurring PortiAI Premium subscription. Cancel it from the billing page before starting a different plan.',
    };
  }

  const wantsIntro = interval === 'monthly' && !subscription.introOfferUsed;
  const expectedAmount = wantsIntro ? intro : recurringFor(interval);

  /* Reuse a recent unfinished attempt instead of creating a second one. */
  const recent = await Payment.findOne({
    userId: user._id,
    kind: wantsIntro ? 'intro' : interval,
    status: { $in: ['created', 'pending'] },
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    ...(wantsIntro ? { providerOrderId: { $ne: '' } } : { providerSubscriptionId: { $ne: '' } }),
  }).sort({ createdAt: -1 });

  if (recent && !key) {
    return {
      mode: recent.providerSubscriptionId ? 'razorpay_subscription' : 'razorpay_order',
      paymentRecordId: recent._id.toString(),
      orderId: recent.providerOrderId || null,
      subscriptionId: recent.providerSubscriptionId || null,
      amount: recent.amount,
      currency: recent.currency,
      keyId: env.razorpay.keyId,
      interval,
      description: recent.description,
      prefill: { name: user.name, email: user.email },
      replayed: true,
    };
  }

  /* -------------------------------------------------- ₹9 introductory month */
  if (wantsIntro) {
    const payment = await Payment.create({
      userId: user._id,
      subscriptionId: subscription._id,
      provider: 'razorpay',
      kind: 'intro',
      status: 'created',
      amount: expectedAmount,
      currency: pricing.currency,
      receiptNumber: receiptNumber(),
      description: `PortiAI Premium — first month ${pricing.monthly.introDisplay}`,
      idempotencyKey: key || undefined,
      metadata: { interval: 'monthly', recurringAmount: recurringFor('monthly') },
    });

    let order;
    try {
      order = await razorpay.createOrder({
        amount: expectedAmount,
        currency: pricing.currency,
        receipt: payment.receiptNumber,
        notes: {
          product: 'portiai-premium',
          purpose: 'intro',
          paymentRecordId: payment._id.toString(),
          userId: user._id.toString(),
          interval: 'monthly',
        },
      });
    } catch (error) {
      payment.status = 'failed';
      payment.failureReason = error.message;
      await payment.save();
      throw error;
    }

    payment.providerOrderId = order.id;
    await payment.save();

    subscription.status = subscription.status === 'active' ? 'active' : 'pending';
    subscription.interval = 'monthly';
    subscription.amount = recurringFor('monthly');
    subscription.currency = pricing.currency;
    subscription.note = `First month ${pricing.monthly.introDisplay}, then ${pricing.monthly.display} per month. Recurring billing starts after the first month.`;
    await subscription.save();

    return {
      mode: 'razorpay_order',
      step: 1,
      steps: 2,
      paymentRecordId: payment._id.toString(),
      orderId: order.id,
      amount: expectedAmount,
      currency: pricing.currency,
      keyId: env.razorpay.keyId,
      interval: 'monthly',
      description: payment.description,
      prefill: { name: user.name, email: user.email },
      intro: {
        amount: expectedAmount,
        display: pricing.monthly.introDisplay,
        recurringAmount: recurringFor('monthly'),
        recurringDisplay: pricing.monthly.display,
        disclosure: pricing.monthly.disclosure,
      },
    };
  }

  /* ---------------------------------------- Recurring monthly / yearly plan */
  /*
   * If a paid period is still running (for example the ₹9 introductory month),
   * the recurring mandate starts when it ends rather than charging twice.
   */
  const deferUntil = user.premiumUntil && new Date(user.premiumUntil) > new Date() ? new Date(user.premiumUntil) : null;
  const providerSubscription = await createProviderSubscription(user, {
    interval,
    startAt: deferUntil,
  });

  const payment = await Payment.create({
    userId: user._id,
    subscriptionId: subscription._id,
    provider: 'razorpay',
    kind: interval,
    status: 'created',
    amount: expectedAmount,
    currency: pricing.currency,
    receiptNumber: receiptNumber(),
    providerSubscriptionId: providerSubscription.subscription.id,
    description:
      interval === 'yearly'
        ? `PortiAI Premium — yearly ${pricing.yearly.display}`
        : `PortiAI Premium — ${pricing.monthly.display} per month`,
    idempotencyKey: key || undefined,
    metadata: { interval, months: monthsFor(interval) },
  });

  subscription.provider = 'razorpay';
  subscription.providerSubscriptionId = providerSubscription.subscription.id;
  subscription.providerPlanId = providerSubscription.planId;
  subscription.providerCustomerId = user.razorpayCustomerId || providerSubscription.subscription.customer_id || '';
  subscription.interval = interval;
  subscription.amount = expectedAmount;
  subscription.currency = pricing.currency;
  subscription.status = 'pending';
  subscription.cancelAtPeriodEnd = false;
  subscription.cancelledAt = null;
  subscription.cancelEffectiveAt = null;
  subscription.note =
    interval === 'yearly'
      ? pricing.yearly.disclosure
      : `${pricing.monthly.display} per month until you cancel.`;
  await subscription.save();

  return {
    mode: 'razorpay_subscription',
    step: 1,
    steps: 1,
    paymentRecordId: payment._id.toString(),
    subscriptionId: providerSubscription.subscription.id,
    shortUrl: providerSubscription.subscription.short_url || null,
    amount: expectedAmount,
    currency: pricing.currency,
    keyId: env.razorpay.keyId,
    interval,
    description: payment.description,
    prefill: { name: user.name, email: user.email },
    disclosure:
      interval === 'yearly'
        ? pricing.yearly.disclosure
        : `${pricing.monthly.display} charged now, then ${pricing.monthly.display} every month until you cancel.`,
  };
};

/**
 * Creates (or reuses) the ₹299/month mandate for a user who has already paid the
 * introductory month. Used as step 2 of the monthly flow, and to recover when
 * the user closed the authorisation window.
 */
export const createMandateSession = async (user, { idempotencyKey = '' } = {}) => {
  if (!billingConfigured()) {
    throw ApiError.serviceUnavailable(
      'Online payments are not configured on this server yet.',
      'PAYMENT_NOT_CONFIGURED'
    );
  }

  const { pricing, recurringFor } = amounts();
  const subscription = await ensureSubscription(user);

  if (!subscription.introOfferUsed) {
    throw ApiError.badRequest(
      'Authorise the recurring plan after the first month has been paid, or start a normal monthly subscription from the pricing page.'
    );
  }

  if (subscription.providerSubscriptionId && ['active', 'pending'].includes(subscription.status)) {
    let shortUrl = null;
    try {
      const existing = await razorpay.fetchSubscription(subscription.providerSubscriptionId);
      shortUrl = existing?.short_url || null;
    } catch {
      /* the subscription id is still valid for Checkout.js */
    }
    return {
      mode: 'razorpay_subscription',
      subscriptionId: subscription.providerSubscriptionId,
      shortUrl,
      amount: subscription.amount || recurringFor('monthly'),
      currency: subscription.currency || pricing.currency,
      keyId: env.razorpay.keyId,
      interval: subscription.interval || 'monthly',
      startAt: subscription.currentPeriodStart || null,
      replayed: true,
      prefill: { name: user.name, email: user.email },
      disclosure: subscription.note || pricing.monthly.disclosure,
    };
  }

  const key = normalizeIdempotencyKey(user, idempotencyKey) || `mandate:${user._id}:${Date.now()}`;
  const startAt = new Date(Math.max(new Date(user.premiumUntil || Date.now()).getTime(), Date.now() + MINIMUM_START_DELAY_MS));

  const { subscription: providerSubscription, planId } = await createProviderSubscription(user, {
    interval: 'monthly',
    startAt,
  });

  const payment = await Payment.create({
    userId: user._id,
    subscriptionId: subscription._id,
    provider: 'razorpay',
    kind: 'monthly',
    status: 'created',
    amount: recurringFor('monthly'),
    currency: pricing.currency,
    receiptNumber: receiptNumber(),
    providerSubscriptionId: providerSubscription.id,
    description: `PortiAI Premium — recurring mandate from ${startAt.toLocaleDateString('en-IN', { timeZone: 'UTC' })}`,
    idempotencyKey: key,
    metadata: { interval: 'monthly', mandateStartAt: startAt.toISOString() },
  });

  subscription.provider = 'razorpay';
  subscription.providerSubscriptionId = providerSubscription.id;
  subscription.providerPlanId = planId;
  subscription.providerCustomerId = user.razorpayCustomerId || providerSubscription.customer_id || '';
  subscription.interval = 'monthly';
  subscription.amount = recurringFor('monthly');
  subscription.currency = pricing.currency;
  subscription.status = 'pending';
  subscription.note = `Recurring ${pricing.monthly.display} per month starts on ${startAt.toISOString()}.`;
  await subscription.save();

  return {
    mode: 'razorpay_subscription',
    step: 2,
    steps: 2,
    paymentRecordId: payment._id.toString(),
    subscriptionId: providerSubscription.id,
    amount: recurringFor('monthly'),
    currency: pricing.currency,
    keyId: env.razorpay.keyId,
    interval: 'monthly',
    startAt: startAt.toISOString(),
    prefill: { name: user.name, email: user.email },
    description: payment.description,
    disclosure: `Authorising starts a ${pricing.monthly.display} monthly subscription from ${startAt.toLocaleDateString(
      'en-IN',
      { timeZone: 'UTC' }
    )}. Cancel any time.`,
  };
};

/* -------------------------------------------------------- Entitlement */

const loadUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Account no longer exists for this payment.');
  return user;
};

/**
 * Writes a paid period to the user and the subscription document.
 * Never shortens existing access (see `activatePremium`).
 */
const applyPaidPeriod = async ({ user, subscription, interval, periodStart, periodEnd, source = 'billing' }) => {
  const refreshed = await loadUser(user._id);
  const entitlements = await activatePremium(refreshed, { until: periodEnd, source });

  if (subscription) {
    subscription.status = 'active';
    subscription.interval = interval;
    subscription.startedAt = subscription.startedAt || periodStart || new Date();
    subscription.currentPeriodStart = periodStart || new Date();
    subscription.currentPeriodEnd = new Date(entitlements.premiumUntil);
    subscription.cancelAtPeriodEnd = false;
    subscription.cancelledAt = null;
    subscription.cancelEffectiveAt = null;
    subscription.endedAt = null;
    subscription.lastPaymentAt = new Date();
    await subscription.save();
  }

  return { user: refreshed, entitlements, subscription };
};

const markPayment = async (payment, patch) => {
  try {
    await Payment.updateOne({ _id: payment._id }, { $set: patch });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return Payment.findById(payment._id);
};

const markPaymentFailed = async (payment, reason, metadata = {}) => {
  if (!payment || payment.status === 'captured') return payment;
  return markPayment(payment, {
    status: 'failed',
    failureReason: String(reason || 'Payment failed').slice(0, 500),
    metadata: { ...(payment.metadata || {}), ...metadata },
  });
};

/** Applies the ₹9 introductory month exactly once. */
const applyIntroPayment = async ({ user, payment, providerPaymentId, source = 'checkout' }) => {
  const subscription = await ensureSubscription(user);

  if (subscription.introOfferUsed) {
    // Access was already granted for this offer; record the payment only.
    await markPayment(payment, {
      status: 'captured',
      signatureVerified: source === 'checkout' ? true : payment.signatureVerified,
      providerPaymentId,
      paidAt: payment.paidAt || new Date(),
    });
    return {
      alreadyApplied: true,
      subscription,
      entitlements: resolveEntitlements(await loadUser(user._id), subscription),
    };
  }

  const now = new Date();
  const base = user.premiumUntil && new Date(user.premiumUntil) > now ? new Date(user.premiumUntil) : now;
  const periodEnd = addMonths(base, 1);

  subscription.introOfferUsed = true;
  subscription.introPaidAt = now;
  subscription.interval = 'monthly';
  subscription.amount = amounts().recurringFor('monthly');
  subscription.currency = getPricing().currency;
  subscription.note = `First month paid at ${getPricing().monthly.introDisplay}. Authorise the recurring plan to continue after ${periodEnd.toLocaleDateString(
    'en-IN',
    { timeZone: 'UTC' }
  )}.`;

  const applied = await applyPaidPeriod({
    user,
    subscription,
    interval: 'monthly',
    periodStart: now,
    periodEnd,
    source: 'billing',
  });

  await markPayment(payment, {
    status: 'captured',
    signatureVerified: source === 'checkout' ? true : payment.signatureVerified,
    providerPaymentId,
    paidAt: now,
    subscriptionId: subscription._id,
  });

  return { applied, subscription, entitlements: applied.entitlements };
};

/** Applies a recurring charge for a subscription. */
const applySubscriptionCharge = async ({
  user,
  subscription,
  payment,
  providerPaymentId,
  providerSubscription,
  interval,
  source,
  periodStart = null,
  periodEnd = null,
}) => {
  const now = new Date();
  const months = interval === 'yearly' ? 12 : 1;
  const start = periodStart || (providerSubscription ? fromUnix(providerSubscription.current_start) : null) || now;
  let end = periodEnd || (providerSubscription ? fromUnix(providerSubscription.current_end) : null);
  if (!end) end = addMonths(start, months);

  if (providerSubscription) {
    subscription.providerSubscriptionId = providerSubscription.id || subscription.providerSubscriptionId;
    subscription.providerPlanId = providerSubscription.plan_id || subscription.providerPlanId;
    subscription.providerCustomerId = providerSubscription.customer_id || subscription.providerCustomerId;
  }

  const applied = await applyPaidPeriod({
    user,
    subscription,
    interval,
    periodStart: start,
    periodEnd: end,
    source: 'billing',
  });

  if (payment) {
    await markPayment(payment, {
      status: 'captured',
      signatureVerified: source === 'checkout' ? true : payment.signatureVerified,
      providerPaymentId,
      paidAt: now,
      subscriptionId: subscription._id,
      providerSubscriptionId: subscription.providerSubscriptionId,
    });
  }

  return { applied, subscription, entitlements: applied.entitlements };
};

/* -------------------------------------------------------- Verification */

const fetchAndVerifyProviderPayment = async ({ paymentId, expectedAmount, allowZero = false }) => {
  let entity = await razorpay.fetchPayment(paymentId);
  if (!entity) throw ApiError.badGateway('The payment provider did not return that payment.');

  if (entity.status === 'authorized' && Number(entity.amount) > 0) {
    entity = await razorpay.capturePayment(entity.id, Number(entity.amount), entity.currency || 'INR');
  }

  const amount = Number(entity.amount || 0);
  if (!['captured', 'authorized'].includes(entity.status)) {
    throw ApiError.withCode(
      400,
      'PAYMENT_NOT_CAPTURED',
      `Razorpay reports this payment as "${entity.status}", so Premium was not activated.`
    );
  }
  if (amount === 0 && allowZero) return entity;
  if (amount !== expectedAmount) {
    throw ApiError.withCode(
      400,
      'PAYMENT_AMOUNT_MISMATCH',
      'The amount Razorpay reported does not match the amount PortiAI requested, so Premium was not activated. If money was deducted, contact support with your payment id.'
    );
  }
  if (!['captured', 'authorized'].includes(entity.status)) {
    throw ApiError.withCode(
      400,
      'PAYMENT_NOT_CAPTURED',
      `Razorpay reports this payment as "${entity.status}", so Premium was not activated.`
    );
  }
  return entity;
};

/**
 * Verifies a Checkout.js callback and activates the plan.
 *
 * Checks, in order: ownership of the payment record, HMAC signature, Razorpay's
 * own payment state and amount, then (for subscriptions) the plan the mandate
 * belongs to. Any failure leaves the plan untouched.
 */
export const verifyCheckoutPayment = async (user, payload = {}) => {
  const {
    paymentRecordId,
    razorpay_payment_id: providerPaymentId,
    razorpay_order_id: providerOrderId,
    razorpay_subscription_id: providerSubscriptionId,
    razorpay_signature: signature,
  } = payload;

  if (!/^[a-f0-9]{24}$/i.test(String(paymentRecordId || ''))) {
    throw ApiError.badRequest('That payment record id is not valid.');
  }
  if (!providerPaymentId || !signature) {
    throw ApiError.badRequest('The payment provider response is incomplete.');
  }

  const payment = await Payment.findOne({ _id: paymentRecordId, userId: user._id });
  if (!payment) throw ApiError.notFound('Payment record not found.');

  if (payment.status === 'captured') {
    const subscription = await ensureSubscription(user);
    return {
      status: 'captured',
      alreadyProcessed: true,
      payment: payment.toReceiptJSON(),
      subscription: subscription.toOwnerJSON(),
      entitlements: resolveEntitlements(await loadUser(user._id), subscription),
    };
  }

  const subscription = await ensureSubscription(user);

  try {
    if (providerOrderId) {
      /* --------------------------------------- One-time order (₹9 intro) */
      if (payment.providerOrderId !== providerOrderId) {
        throw ApiError.withCode(400, 'PAYMENT_ORDER_MISMATCH', 'That order does not belong to this payment.');
      }
      if (!razorpay.verifyOrderSignature(providerOrderId, providerPaymentId, signature)) {
        throw ApiError.withCode(
          400,
          'PAYMENT_SIGNATURE_INVALID',
          'The payment signature could not be verified, so Premium was not activated.'
        );
      }

      const order = await razorpay.fetchOrder(providerOrderId);
      if (Number(order.amount) !== Number(payment.amount) || order.currency !== payment.currency) {
        throw ApiError.withCode(400, 'PAYMENT_AMOUNT_MISMATCH', 'The order amount does not match the server-side price.');
      }

      const providerPayment = await fetchAndVerifyProviderPayment({
        paymentId: providerPaymentId,
        expectedAmount: Number(payment.amount),
      });
      if (providerPayment.order_id && providerPayment.order_id !== providerOrderId) {
        throw ApiError.withCode(400, 'PAYMENT_ORDER_MISMATCH', 'Razorpay reports a different order for this payment.');
      }

      if (payment.kind === 'intro') {
        const result = await applyIntroPayment({
          user,
          payment,
          providerPaymentId: providerPayment.id,
          source: 'checkout',
        });

        // Step 2: give the client a mandate to authorise when possible. The
        // user is reloaded so the mandate starts after the month just paid for.
        let mandate = null;
        let mandateError = '';
        try {
          mandate = await createMandateSession(await loadUser(user._id));
        } catch (error) {
          mandateError = error.message;
        }

        return {
          status: 'captured',
          step: 1,
          nextStep: mandate ? 2 : null,
          mandate,
          mandateError,
          payment: (await Payment.findById(payment._id)).toReceiptJSON(),
          subscription: (await ensureSubscription(user)).toOwnerJSON(),
          entitlements: result.entitlements,
        };
      }

      throw ApiError.withCode(400, 'PAYMENT_KIND_UNSUPPORTED', 'That payment type cannot be verified here.');
    }

    if (providerSubscriptionId) {
      /* ------------------------------------ Recurring subscription payment */
      if (payment.providerSubscriptionId && payment.providerSubscriptionId !== providerSubscriptionId) {
        throw ApiError.withCode(400, 'PAYMENT_SUBSCRIPTION_MISMATCH', 'That subscription does not belong to this payment.');
      }
      if (!razorpay.verifySubscriptionSignature(providerPaymentId, providerSubscriptionId, signature)) {
        throw ApiError.withCode(
          400,
          'PAYMENT_SIGNATURE_INVALID',
          'The subscription signature could not be verified, so Premium was not activated.'
        );
      }

      const providerSubscription = await razorpay.fetchSubscription(providerSubscriptionId);
      if (['cancelled', 'expired', 'completed'].includes(providerSubscription.status)) {
        throw ApiError.withCode(400, 'SUBSCRIPTION_INACTIVE', 'That subscription is no longer active.');
      }

      const interval = payment.kind === 'yearly' ? 'yearly' : 'monthly';

      /* Confirm the amount against the Razorpay plan, not against the client. */
      let planAmount = null;
      if (providerSubscription.plan_id) {
        try {
          const plan = await razorpay.fetchPlan(providerSubscription.plan_id);
          planAmount = Number(plan?.item?.amount);
        } catch {
          /* the payment/order amount check below still applies */
        }
      }
      if (planAmount && planAmount !== Number(payment.amount)) {
        throw ApiError.withCode(400, 'PAYMENT_AMOUNT_MISMATCH', 'The Razorpay plan amount does not match the server-side price.');
      }

      const providerPayment = await fetchAndVerifyProviderPayment({
        paymentId: providerPaymentId,
        expectedAmount: Number(payment.amount),
        // A mandate with a future start authorises without charging today.
        allowZero: true,
      });

      const chargedNow = Number(providerPayment.amount || 0) >= Number(payment.amount);
      const providerEnd = fromUnix(providerSubscription.current_end);

      if (!chargedNow) {
        /* Mandate authorised, first charge scheduled in the future. */
        payment.status = 'pending';
        payment.signatureVerified = true;
        payment.providerPaymentId = providerPayment.id;
        payment.metadata = {
          ...(payment.metadata || {}),
          mandateAuthorized: true,
          mandateStatus: providerSubscription.status,
        };
        await payment.save();

        subscription.providerSubscriptionId = providerSubscription.id;
        subscription.providerPlanId = providerSubscription.plan_id;
        subscription.interval = interval;
        subscription.amount = Number(payment.amount);
        subscription.status = ['active', 'authenticated'].includes(providerSubscription.status) ? 'active' : 'pending';
        subscription.note = `Recurring ${interval} billing authorised. The first ${interval} charge is scheduled by Razorpay.`;
        await subscription.save();

        return {
          status: 'mandate_authorized',
          chargedNow: false,
          payment: payment.toReceiptJSON(),
          subscription: subscription.toOwnerJSON(),
          entitlements: resolveEntitlements(await loadUser(user._id), subscription),
          message: 'Recurring billing is authorised. Your first recurring charge is scheduled by Razorpay.',
        };
      }

      const result = await applySubscriptionCharge({
        user,
        subscription,
        payment,
        providerPaymentId: providerPayment.id,
        providerSubscription,
        interval,
        periodStart: fromUnix(providerSubscription.current_start) || new Date(),
        periodEnd: providerEnd || addMonths(new Date(), interval === 'yearly' ? 12 : 1),
        source: 'checkout',
      });

      return {
        status: 'captured',
        chargedNow: true,
        payment: (await Payment.findById(payment._id)).toReceiptJSON(),
        subscription: result.subscription.toOwnerJSON(),
        entitlements: result.entitlements,
      };
    }

    throw ApiError.badRequest('That payment is neither an order nor a subscription.');
  } catch (error) {
    if (payment.status !== 'captured') {
      await markPaymentFailed(payment, error.message, { failedAt: new Date().toISOString() }).catch(() => {});
    }
    throw error;
  }
};

/* ---------------------------------------------------------- Cancellation */

/** GET-style helper used by the billing page. */
export const getCancellationPreview = async (user) => {
  const subscription = await Subscription.findOne({ userId: user._id });
  if (!subscription || !resolveEntitlements(user, subscription).isPremium) {
    return { canCancel: false, accessUntil: null, message: 'There is no active subscription to cancel.' };
  }
  if (subscription.cancelAtPeriodEnd) {
    return {
      canCancel: false,
      accessUntil: subscription.cancelEffectiveAt || subscription.currentPeriodEnd || user.premiumUntil,
      message: 'This subscription is already cancelled and will not renew.',
    };
  }
  return {
    canCancel: true,
    accessUntil: subscription.currentPeriodEnd || user.premiumUntil,
    message: `Premium stays active until ${new Date(subscription.currentPeriodEnd || user.premiumUntil).toLocaleDateString(
      'en-IN'
    )}. The subscription will not renew.`,
  };
};

/**
 * Cancels at the end of the paid period (the default, so the user keeps what
 * they paid for). `immediate` revokes access now and cancels the mandate.
 */
export const cancelUserSubscription = async (user, { immediate = false, reason = '' } = {}) => {
  const subscription = await Subscription.findOne({ userId: user._id });
  if (!subscription) throw ApiError.notFound('There is no subscription on this account.');

  if (subscription.providerSubscriptionId) {
    try {
      await razorpay.cancelSubscription(subscription.providerSubscriptionId, !immediate);
    } catch (error) {
      // A mandate that was never authenticated cannot be cancelled at Razorpay.
      // Anything else is surfaced so the UI never claims a cancellation that
      // did not happen.
      const pendingOnly = subscription.status === 'pending' || subscription.status === 'failed';
      if (!pendingOnly) throw error;
    }
  }

  const accessUntil = subscription.currentPeriodEnd || user.premiumUntil || new Date();
  subscription.cancelAtPeriodEnd = !immediate;
  subscription.cancelledAt = new Date();
  subscription.cancelEffectiveAt = immediate ? new Date() : accessUntil;
  subscription.status = 'cancelled';
  subscription.note = immediate
    ? 'Cancelled immediately. Premium access has ended.'
    : `Cancelled. Premium stays active until ${new Date(accessUntil).toLocaleDateString('en-IN', {
        timeZone: 'UTC',
      })} and will not renew.`;
  if (reason) subscription.lastFailureReason = String(reason).slice(0, 500);

  if (immediate) {
    subscription.endedAt = new Date();
    await User.updateOne({ _id: user._id }, { $set: { plan: 'free', premiumSource: 'none' } });
  }

  await subscription.save();
  const refreshed = await loadUser(user._id);
  return {
    subscription: subscription.toOwnerJSON(),
    entitlements: resolveEntitlements(refreshed, subscription),
    accessUntil: immediate ? null : accessUntil,
    immediate,
    message: subscription.note,
  };
};

/* --------------------------------------------------------- Expiry sweep */

/**
 * Expires plans whose paid period has ended.
 *
 * Runs from the scheduler, and can be awaited by billing reads so a lapsed
 * subscription is corrected even if the scheduler has not fired yet.
 */
export const expireDueSubscriptions = async ({ limit = 200 } = {}) => {
  const now = new Date();

  const lapsedUsers = await User.find({ plan: 'premium', premiumUntil: { $lte: now } })
    .select('_id')
    .limit(limit);

  if (lapsedUsers.length) {
    const ids = lapsedUsers.map((user) => user._id);
    await User.updateMany(
      { _id: { $in: ids }, plan: 'premium', premiumUntil: { $lte: now } },
      { $set: { plan: 'free', premiumSource: 'none' } }
    );
  }

  const expired = await Subscription.find({
    status: { $in: ['active', 'cancelled', 'failed'] },
    $or: [{ currentPeriodEnd: { $lte: now } }, { endedAt: { $lte: now } }],
  })
    .select('_id userId currentPeriodEnd')
    .limit(limit);

  if (expired.length) {
    await Subscription.updateMany(
      { _id: { $in: expired.map((item) => item._id) } },
      { $set: { status: 'expired', cancelAtPeriodEnd: false, endedAt: now } }
    );
    // Only revoke users whose paid period is genuinely over.
    await User.updateMany(
      { _id: { $in: expired.map((item) => item.userId) }, plan: 'premium', premiumUntil: { $lte: now } },
      { $set: { plan: 'free', premiumSource: 'none' } }
    );
  }

  return { usersExpired: lapsedUsers.length, subscriptionsExpired: expired.length };
};

/* -------------------------------------------------------------- Webhook */

const findSubscriptionForEntity = async (entity) => {
  let subscription = entity?.id
    ? await Subscription.findOne({ providerSubscriptionId: entity.id })
    : null;
  if (subscription) return subscription;

  const userId = entity?.notes?.userId;
  if (userId && /^[a-f0-9]{24}$/i.test(String(userId))) {
    const user = await User.findById(userId);
    if (user) {
      subscription = await ensureSubscription(user);
      if (entity?.id) subscription.providerSubscriptionId = entity.id;
      return subscription;
    }
  }
  return null;
};

const handleCapturedPayment = async (entity) => {
  const providerPaymentId = entity.id;
  const subscriptionId = entity.subscription_id || null;
  const notes = entity.notes || {};

  let payment =
    (providerPaymentId && (await Payment.findOne({ providerPaymentId }))) ||
    (entity.order_id && (await Payment.findOne({ providerOrderId: entity.order_id }))) ||
    (notes.paymentRecordId && /^[a-f0-9]{24}$/i.test(String(notes.paymentRecordId))
      ? await Payment.findById(notes.paymentRecordId)
      : null) ||
    // A mandate that was awaiting its first charge now produced that charge.
    (subscriptionId
      ? await Payment.findOne({
          providerSubscriptionId: subscriptionId,
          status: { $in: ['created', 'pending'] },
        }).sort({ createdAt: 1 })
      : null);

  if (payment?.status === 'captured') return { status: 'duplicate', paymentId: payment._id.toString() };

  const subscription =
    (payment?.subscriptionId ? await Subscription.findById(payment.subscriptionId) : null) ||
    (subscriptionId ? await Subscription.findOne({ providerSubscriptionId: subscriptionId }) : null);

  const user = payment ? await User.findById(payment.userId) : subscription ? await User.findById(subscription.userId) : null;
  if (!user) return { status: 'ignored', reason: 'No PortiAI account matches this payment.' };

  const expectedAmount = payment ? Number(payment.amount) : Number(subscription?.amount || 0);
  if (!expectedAmount || Number(entity.amount) !== expectedAmount) {
    console.warn(
      `[billing] webhook amount mismatch for payment ${providerPaymentId}: got ${entity.amount}, expected ${expectedAmount}`
    );
    return { status: 'ignored', reason: 'Amount mismatch' };
  }

  if (payment?.kind === 'intro') {
    const result = await applyIntroPayment({
      user,
      payment,
      providerPaymentId,
      source: 'webhook',
    });
    return { status: 'processed', kind: 'intro', subscriptionId: subscription?._id?.toString() };
  }

  /* Recurring charge: find or create the audit record. */
  const subDoc = subscription || (await ensureSubscription(user));
  if (!payment) {
    try {
      payment = await Payment.create({
        userId: user._id,
        subscriptionId: subDoc._id,
        provider: 'razorpay',
        kind: 'renewal',
        status: 'captured',
        amount: Number(entity.amount),
        currency: entity.currency || 'INR',
        providerPaymentId,
        providerSubscriptionId: subDoc.providerSubscriptionId || subscriptionId || '',
        receiptNumber: receiptNumber(),
        description: 'PortiAI Premium — renewal',
        signatureVerified: true,
        paidAt: entity.created_at ? fromUnix(entity.created_at) : new Date(),
        eventId: entity.event_id || '',
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      payment = await Payment.findOne({ providerPaymentId });
    }
  }

  const providerSubscription = subscriptionId ? await razorpay.fetchSubscription(subscriptionId).catch(() => null) : null;
  const interval = subDoc.interval || (payment?.kind === 'yearly' ? 'yearly' : 'monthly');

  await applySubscriptionCharge({
    user,
    subscription: subDoc,
    payment,
    providerPaymentId,
    providerSubscription,
    interval,
    periodStart: providerSubscription ? fromUnix(providerSubscription.current_start) : null,
    periodEnd: providerSubscription ? fromUnix(providerSubscription.current_end) : null,
    source: 'webhook',
  });

  return { status: 'processed', kind: 'charge', paymentId: payment?._id?.toString() };
};

const handleFailedPayment = async (entity) => {
  const providerPaymentId = entity.id;
  const notes = entity.notes || {};
  const payment =
    (providerPaymentId && (await Payment.findOne({ providerPaymentId }))) ||
    (entity.order_id && (await Payment.findOne({ providerOrderId: entity.order_id }))) ||
    (notes.paymentRecordId && /^[a-f0-9]{24}$/i.test(String(notes.paymentRecordId))
      ? await Payment.findById(notes.paymentRecordId)
      : null);

  const subscription = entity.subscription_id
    ? await Subscription.findOne({ providerSubscriptionId: entity.subscription_id })
    : payment?.subscriptionId
      ? await Subscription.findById(payment.subscriptionId)
      : null;

  if (payment && payment.status !== 'captured') {
    await markPaymentFailed(payment, entity.error_description || entity.error_reason || 'Payment failed', {
      providerStatus: entity.status,
    });
  } else if (!payment && subscription) {
    /* A retry attempt that was never initiated by PortiAI: record it for support. */
    try {
      await Payment.create({
        userId: subscription.userId,
        subscriptionId: subscription._id,
        provider: 'razorpay',
        kind: 'renewal',
        status: 'failed',
        amount: Number(entity.amount || subscription.amount || 0),
        currency: entity.currency || 'INR',
        providerPaymentId,
        providerSubscriptionId: subscription.providerSubscriptionId,
        receiptNumber: receiptNumber(),
        description: 'PortiAI Premium — failed renewal attempt',
        failureReason: String(entity.error_description || 'Payment failed').slice(0, 500),
        eventId: entity.event_id || '',
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  if (subscription) {
    subscription.retryCount = (subscription.retryCount || 0) + 1;
    subscription.lastFailureReason = String(
      entity.error_description || entity.error_reason || 'A renewal payment failed'
    ).slice(0, 500);
    subscription.status = 'failed';
    subscription.note =
      'A payment failed. Razorpay retries renewals automatically; Premium stays active until the paid period ends.';
    await subscription.save();
  }

  return { status: 'processed', kind: 'payment_failed', subscriptionId: subscription?._id?.toString() };
};

const handleSubscriptionEvent = async (eventType, entity, paymentEntity) => {
  const subscription = await findSubscriptionForEntity(entity);
  if (!subscription) return { status: 'ignored', reason: 'No matching subscription.' };

  const user = await User.findById(subscription.userId);
  if (!user) return { status: 'ignored', reason: 'Account no longer exists.' };

  const interval = subscription.interval || (entity.plan_id && subscription.providerPlanId === env.razorpay.planIdYearly ? 'yearly' : 'monthly');
  const providerEnd = fromUnix(entity.current_end);
  const providerStart = fromUnix(entity.current_start);

  if (!subscription.providerSubscriptionId && entity.id) subscription.providerSubscriptionId = entity.id;
  if (entity.plan_id) subscription.providerPlanId = entity.plan_id;
  if (entity.customer_id) subscription.providerCustomerId = entity.customer_id;
  subscription.interval = interval;

  if (['subscription.activated', 'subscription.authenticated', 'subscription.charged'].includes(eventType)) {
    if (eventType === 'subscription.charged') {
      if (paymentEntity) {
        const existing = await Payment.findOne({ providerPaymentId: paymentEntity.id });
        if (!existing) {
          const amount = Number(paymentEntity.amount || 0);
          const expected = Number(subscription.amount || 0);
          if (expected && amount !== expected) {
            return { status: 'ignored', reason: 'Amount mismatch on renewal' };
          }
          try {
            await Payment.create({
              userId: user._id,
              subscriptionId: subscription._id,
              provider: 'razorpay',
              kind: 'renewal',
              status: 'captured',
              amount,
              currency: paymentEntity.currency || subscription.currency,
              providerPaymentId: paymentEntity.id,
              providerSubscriptionId: entity.id,
              receiptNumber: receiptNumber(),
              description: 'PortiAI Premium — renewal',
              signatureVerified: true,
              paidAt: fromUnix(paymentEntity.created_at) || new Date(),
              eventId: entity.event_id || '',
            });
          } catch (error) {
            if (error.code !== 11000) throw error;
          }
        }
      }
    }

    /*
     * A mandate authenticated ahead of its start date must not extend access:
     * the user has authorised the renewal, but no charge has happened yet.
     */
    if (['subscription.activated', 'subscription.authenticated'].includes(eventType) && providerStart && providerStart.getTime() > Date.now()) {
      subscription.status = 'active';
      subscription.currentPeriodStart = providerStart;
      subscription.currentPeriodEnd = providerEnd || null;
      subscription.note = `Recurring billing authorised. The first charge is scheduled for ${providerStart.toLocaleDateString(
        'en-IN',
        { timeZone: 'UTC' }
      )}.`;
      await subscription.save();
      return { status: 'processed', kind: eventType, mandateOnly: true };
    }

    const end = providerEnd || addMonths(new Date(), interval === 'yearly' ? 12 : 1);
    if (end.getTime() <= Date.now() && eventType !== 'subscription.charged') {
      return { status: 'ignored', reason: 'Subscription period already ended.' };
    }

    await applyPaidPeriod({
      user,
      subscription,
      interval,
      periodStart: providerStart || new Date(),
      periodEnd: end,
      source: 'billing',
    });
    if (eventType === 'subscription.activated' || eventType === 'subscription.authenticated') {
      subscription.status = 'active';
      subscription.note = notes.note || '';
      await subscription.save();
    }
    return { status: 'processed', kind: eventType, subscriptionId: subscription._id.toString() };
  }

  if (eventType === 'subscription.cancelled') {
    subscription.status = 'cancelled';
    subscription.cancelAtPeriodEnd = true;
    subscription.cancelledAt = new Date();
    subscription.cancelEffectiveAt = providerEnd || subscription.currentPeriodEnd || user.premiumUntil || new Date();
    subscription.note = `Cancelled at Razorpay. Access continues until ${new Date(
      subscription.cancelEffectiveAt
    ).toLocaleDateString('en-IN', { timeZone: 'UTC' })}.`;
    await subscription.save();
    return { status: 'processed', kind: 'cancelled' };
  }

  if (['subscription.halted', 'subscription.paused'].includes(eventType)) {
    subscription.status = 'failed';
    subscription.lastFailureReason =
      eventType === 'subscription.halted'
        ? 'Recurring payments were halted by Razorpay after repeated failures.'
        : 'The subscription was paused.';
    subscription.note = 'Premium remains active until the paid period ends. Update your payment method in Razorpay to resume.';
    await subscription.save();
    return { status: 'processed', kind: eventType };
  }

  if (['subscription.expired', 'subscription.completed'].includes(eventType)) {
    const end = providerEnd || new Date();
    const stillPaid = end.getTime() > Date.now();
    if (!stillPaid) {
      await User.updateOne(
        { _id: user._id, plan: 'premium', premiumUntil: { $lte: new Date() } },
        { $set: { plan: 'free', premiumSource: 'none' } }
      );
    }
    subscription.status = 'expired';
    subscription.endedAt = stillPaid ? null : new Date();
    subscription.cancelAtPeriodEnd = false;
    subscription.note = 'The subscription has ended. Premium features are locked until you subscribe again.';
    await subscription.save();
    return { status: 'processed', kind: 'expired' };
  }

  return { status: 'ignored', reason: `Unhandled subscription event ${eventType}` };
};

/**
 * Applies a verified webhook event. The caller has already checked the HMAC and
 * recorded the event id, so this only updates billing state — idempotently.
 */
export const processRazorpayWebhookEvent = async ({ eventType, payload }) => {
  const [scope, action] = String(eventType || '').split('.');
  const entity = payload?.payload?.[scope]?.entity || null;

  if (!entity) return { status: 'ignored', reason: 'No entity in payload.' };

  if (scope === 'payment' && ['captured', 'authorized'].includes(action)) {
    return handleCapturedPayment(entity);
  }
  if (scope === 'payment' && action === 'failed') {
    return handleFailedPayment(entity);
  }
  if (scope === 'subscription') {
    const paymentEntity = payload?.payload?.payment?.entity || null;
    return handleSubscriptionEvent(eventType, entity, paymentEntity);
  }
  if (scope === 'order' && action === 'paid') {
    return { status: 'ignored', reason: 'Payment capture events are handled from payment.captured.' };
  }

  return { status: 'ignored', reason: `Unhandled event ${eventType}` };
};

/** Status of the deployment's payment configuration, safe for the browser. */
export const billingReadiness = () => ({
  configured: billingConfigured(),
  webhookConfigured: Boolean(env.razorpay.webhookSecret),
  keyId: billingConfigured() ? env.razorpay.keyId : null,
});
