import { api } from './api.js';

/**
 * Subscription / entitlement endpoints.
 *
 * The server decides the plan. The client only reads it, so no amount of
 * browser state can unlock premium templates.
 */
export const subscriptionService = {
  status: () => api.get('/subscription'),
};
