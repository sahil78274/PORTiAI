import { Router } from 'express';
import { getSubscription, billingWebhook } from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Current entitlements for the signed-in user. Read-only. */
router.get('/', requireAuth, getSubscription);

/** Billing provider callback. Disabled (501) unless BILLING_WEBHOOK_SECRET is set. */
router.post('/webhook', billingWebhook);

export default router;
