import { Router } from 'express';
import { getPlans, getSubscription, startCheckout, billingWebhook } from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Public pricing. No session, no entitlement data — just plans and amounts. */
router.get('/plans', getPlans);

/** Current entitlements for the signed-in user. Read-only. */
router.get('/', requireAuth, getSubscription);

/**
 * Start an upgrade for the signed-in user. Returns a hosted checkout URL when
 * one is configured, activates in development mode, or returns 503 when the
 * deployment has no way to take a payment. Never grants access by itself in
 * production.
 */
router.post('/checkout', requireAuth, startCheckout);

/** Billing provider callback. Disabled (501) unless BILLING_WEBHOOK_SECRET is set. */
router.post('/webhook', billingWebhook);

export default router;
