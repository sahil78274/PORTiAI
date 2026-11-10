import { Router } from 'express';
import { summary, listSubscriptions, listPayments, listAiUsage, listWebhooks } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * Admin-only reporting. `requireAuth` proves the session, `requireAdmin` checks
 * the role (or an address listed in ADMIN_EMAILS) on the server — hiding the
 * dashboard link in the browser is never the control.
 */
router.use(requireAuth, requireAdmin);

router.get('/summary', summary);
router.get('/subscriptions', listSubscriptions);
router.get('/payments', listPayments);
router.get('/ai-usage', listAiUsage);
router.get('/webhooks', listWebhooks);

export default router;
