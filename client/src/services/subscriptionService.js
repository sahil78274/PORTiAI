import { api } from './api.js';

/**
 * Subscription / entitlement endpoints.
 *
 * The server decides the plan. The client only reads it, so no amount of
 * browser state can unlock premium templates.
 */
export const subscriptionService = {
  /** Entitlements + plans for the signed-in user. */
  status: () => api.get('/subscription'),
  /** Public pricing (plans, amounts, whether checkout is available). */
  plans: () => api.get('/subscription/plans'),
  /**
   * Ask the server to start an upgrade.
   *
   * The response is one of:
   *   { mode: 'checkout', url }   → a hosted payment page to open
   *   { mode: 'activated', … }    → development-only instant activation
   * and it rejects with `BILLING_NOT_CONFIGURED` when this deployment cannot
   * take a payment. The browser never sets the plan itself.
   */
  checkout: (interval = 'monthly') => api.post('/subscription/checkout', { interval }),
};
