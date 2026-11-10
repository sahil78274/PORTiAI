import { api } from './api.js';

/**
 * Billing endpoints (Razorpay).
 *
 * The browser never sends an amount: `checkout` asks the server to create an
 * order or subscription from its own price configuration, and `verify` sends
 * only the identifiers Razorpay's Checkout returned. Premium is granted by the
 * server after it verifies the signature and the provider payment.
 */
export const billingService = {
  /** Public plan list, prices and payment availability. */
  plans: () => api.get('/subscription/plans'),
  /** Signed-in entitlement + subscription record + AI credits. */
  status: () => api.get('/subscription'),
  /** Subscription, receipts and cancellation preview. */
  history: () => api.get('/subscription/history'),
  receipt: (paymentId) => api.get(`/subscription/payments/${paymentId}`),

  /**
   * Start a purchase.
   * Response modes: `razorpay_order`, `razorpay_subscription`,
   * `already_active`, `already_paid`.
   */
  checkout: (interval = 'monthly', idempotencyKey = '') =>
    api.post('/subscription/razorpay/checkout', { interval, idempotencyKey }),

  /** Verify the Checkout.js callback. This is what activates Premium. */
  verify: (payload) => api.post('/subscription/razorpay/verify', payload),

  /** Create/reuse the recurring mandate after the ₹9 first month. */
  mandate: (idempotencyKey = '') => api.post('/subscription/razorpay/mandate', { idempotencyKey }),

  /** Cancel at the end of the paid period (or immediately). */
  cancel: ({ immediate = false, reason = '' } = {}) => api.post('/subscription/cancel', { immediate, reason }),
};
