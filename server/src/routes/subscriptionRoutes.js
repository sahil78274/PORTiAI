import { Router } from 'express';
import {
  getPlans,
  getSubscription,
  razorpayCheckout,
  razorpayVerify,
  razorpayMandate,
  history,
  receipt,
  cancel,
} from '../controllers/billingController.js';
import { startCheckout, billingWebhook } from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Public pricing: three plans, amounts and whether checkout is available. */
router.get('/plans', getPlans);

/** Current entitlements, subscription status and AI credits for the signed-in user. */
router.get('/', requireAuth, getSubscription);

/* ------------------------------------------------------------- Razorpay */

/**
 * Start a purchase. Returns the Razorpay order / subscription ids plus the
 * public key id for Checkout.js. No plan is granted by this request.
 */
router.post('/razorpay/checkout', requireAuth, razorpayCheckout);

/** Verify a Checkout.js callback and activate only if Razorpay confirms it. */
router.post('/razorpay/verify', requireAuth, razorpayVerify);

/** Authorise the recurring mandate after the ₹9 first month. */
router.post('/razorpay/mandate', requireAuth, razorpayMandate);

/* ---------------------------------------------------- History & cancel */

router.get('/history', requireAuth, history);
router.get('/payments/:id', requireAuth, receipt);
router.post('/cancel', requireAuth, cancel);

/* ------------------------------------------------------- Legacy paths */

/** Development-only instant upgrade or a pre-Razorpay hosted checkout. */
router.post('/checkout', requireAuth, startCheckout);

/** Legacy provider callback. Disabled (501) unless BILLING_WEBHOOK_SECRET is set. */
router.post('/webhook', billingWebhook);

export default router;
