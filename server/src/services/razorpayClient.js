import crypto from 'node:crypto';
import { env, isRazorpayConfigured, isRazorpayWebhookConfigured } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Minimal Razorpay REST client.
 *
 * Deliberately dependency-free: Razorpay's API is a small JSON/REST surface and
 * the Basic-auth header is trivial, so there is no SDK to keep in step. The key
 * secret is read here from the environment and is never logged, returned or
 * included in an error message.
 *
 * Every call has a timeout and maps provider failures onto the API's own error
 * codes so a provider outage cannot look like a successful payment.
 */

const TIMEOUT_MS = Number(process.env.RAZORPAY_TIMEOUT_MS || 20000);

export const razorpayConfigured = () => isRazorpayConfigured();
export const razorpayWebhookConfigured = () => isRazorpayWebhookConfigured();

const authHeader = () =>
  `Basic ${Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64')}`;

const providerError = (status, message, body) => {
  const code = body?.error?.code || '';
  if (status === 401) {
    return ApiError.serviceUnavailable(
      'Razorpay rejected the API credentials on this server. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      'PAYMENT_PROVIDER_AUTH'
    );
  }
  if (status === 400 && /plan|amount|start_at|total_count/i.test(message)) {
    return ApiError.withCode(
      400,
      'PAYMENT_PROVIDER_INVALID',
      `Razorpay could not create this payment: ${message}`
    );
  }
  if (status === 429) {
    return ApiError.tooMany('The payment provider is rate limiting this deployment. Try again in a moment.');
  }
  return ApiError.badGateway(
    `The payment provider returned an error${code ? ` (${code})` : ''}. Nothing was charged by PortiAI; try again shortly.`,
    'PAYMENT_PROVIDER_ERROR'
  );
};

/**
 * Performs one authenticated request.
 * @param {'GET'|'POST'|'PATCH'} method
 * @param {string} path  e.g. `/v1/orders`
 * @param {object} [body]
 */
async function request(method, path, body) {
  if (!razorpayConfigured()) {
    throw ApiError.serviceUnavailable(
      'Online payments are not configured on this server yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the API service.',
      'PAYMENT_NOT_CONFIGURED'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${env.razorpay.apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw ApiError.badGateway('The payment provider did not respond in time. Please try again.', 'PAYMENT_PROVIDER_TIMEOUT');
    }
    throw ApiError.badGateway(
      'The payment provider could not be reached from this server. Please try again shortly.',
      'PAYMENT_PROVIDER_UNREACHABLE'
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.description || payload?.error?.reason || `HTTP ${response.status}`;
    console.warn(`[razorpay] ${method} ${path} failed: ${response.status} ${message}`);
    throw providerError(response.status, message, payload);
  }

  return payload;
}

/* --------------------------------------------------------------- Orders */

/** Creates a one-time order. `amount` is in paise. */
export const createOrder = (payload) => request('POST', '/v1/orders', payload);

export const fetchOrder = (orderId) => request('GET', `/v1/orders/${encodeURIComponent(orderId)}`);

export const fetchOrderPayments = (orderId) =>
  request('GET', `/v1/orders/${encodeURIComponent(orderId)}/payments`);

export const fetchPayment = (paymentId) => request('GET', `/v1/payments/${encodeURIComponent(paymentId)}`);

/* ---------------------------------------------------------------- Plans */

/** Creates a recurring plan. `amount` is in paise, `period` monthly|yearly. */
export const createPlan = (payload) => request('POST', '/v1/plans', payload);

export const fetchPlan = (planId) => request('GET', `/v1/plans/${encodeURIComponent(planId)}`);

/* -------------------------------------------------------- Subscriptions */

export const createSubscription = (payload) => request('POST', '/v1/subscriptions', payload);

export const fetchSubscription = (subscriptionId) =>
  request('GET', `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`);

/**
 * Cancels a subscription.
 * `cancelAtCycleEnd` keeps access (and the mandate) until the paid period ends.
 */
export const cancelSubscription = (subscriptionId, cancelAtCycleEnd = true) =>
  request('POST', `/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
  });

/* ------------------------------------------------------------ Customers */

/** Finds (or creates) the Razorpay customer for an account. */
export const ensureCustomer = async ({ name, email, contact }) => {
  const customer = await request('POST', '/v1/customers', {
    name: name || 'PortiAI customer',
    email,
    ...(contact ? { contact } : {}),
    // Returns the existing customer instead of erroring on a duplicate email.
    fail_existing: 0,
  });
  return customer;
};

/* ----------------------------------------------------------- Signatures */

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (!left.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const hmacHex = (value, secret) => crypto.createHmac('sha256', secret).update(value, 'utf8').digest('hex');

/** Checkout signature for a one-time order: `order_id|payment_id`. */
export const verifyOrderSignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) return false;
  const expected = hmacHex(`${orderId}|${paymentId}`, env.razorpay.keySecret);
  return safeEqual(expected, String(signature).toLowerCase()) || safeEqual(expected, signature);
};

/** Checkout signature for a subscription mandate: `payment_id|subscription_id`. */
export const verifySubscriptionSignature = (paymentId, subscriptionId, signature) => {
  if (!paymentId || !subscriptionId || !signature) return false;
  const expected = hmacHex(`${paymentId}|${subscriptionId}`, env.razorpay.keySecret);
  return safeEqual(expected, String(signature).toLowerCase()) || safeEqual(expected, signature);
};

/**
 * Webhook signature: HMAC-SHA256 of the **raw** request body with the webhook
 * secret. Must be checked before any payload field is trusted.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!isRazorpayWebhookConfigured() || !signature || !rawBody) return false;
  const expected = hmacHex(rawBody.toString('utf8'), env.razorpay.webhookSecret);
  return safeEqual(expected, String(signature).toLowerCase()) || safeEqual(expected, signature);
};

export { providerError as mapRazorpayError };

/** Captures an authorised payment. `amount` is in paise. */
export const capturePayment = (paymentId, amount, currency = 'INR') =>
  request('POST', `/v1/payments/${encodeURIComponent(paymentId)}/capture`, { amount, currency });
