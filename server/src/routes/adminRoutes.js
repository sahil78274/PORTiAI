import { Router } from 'express';
import {
  summary,
  listUsers,
  getUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  grantPremium,
  revokePremium,
  listSubscriptions,
  listPayments,
  getPayment,
  aiBuilderStats,
  listGenerations,
  listAiProjects,
  listAiUsage,
  analytics,
  listPortfolios,
  getPortfolio,
  unpublishPortfolio,
  deletePortfolio,
  listBlogPosts,
  setBlogPublish,
  deleteBlogPost,
  listTemplates,
  setTemplateEnabled,
  reportUsersCsv,
  reportSubscriptionsCsv,
  reportPaymentsCsv,
  reportAiUsageCsv,
  reportProjectsCsv,
  listAuditLogs,
  listWebhooks,
} from '../controllers/adminController.js';
import { adminLogin, adminMe, adminChangePassword } from '../controllers/adminAuthController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  loginSchema,
} from '../validators/authInput.js';
import {
  userListQuerySchema,
  subscriptionListQuerySchema,
  paymentListQuerySchema,
  generationListQuerySchema,
  projectListQuerySchema,
  portfolioListQuerySchema,
  blogListQuerySchema,
  auditLogQuerySchema,
  grantPremiumSchema,
  revokePremiumSchema,
  suspendSchema,
  publishSchema,
  templateToggleSchema,
  changePasswordSchema,
} from '../validators/adminInput.js';

const router = Router();

/**
 * Administrator-only API.
 *
 * `POST /login` is the dedicated admin sign-in: it verifies the credentials
 * and the administrator role against the database before issuing a session.
 * Every other route requires `requireAuth` (a valid session) followed by
 * `requireAdmin` (role === 'admin' in the database, or an address listed in
 * ADMIN_EMAILS). Hiding a link in the browser is never the control.
 */
router.post('/login', authLimiter, validate(loginSchema), adminLogin);

router.use(requireAuth, requireAdmin);

router.get('/me', adminMe);
router.patch('/me/password', validate(changePasswordSchema), adminChangePassword);

router.get('/summary', summary);

/* User management */
router.get('/users', validate(userListQuerySchema, 'query'), listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/suspend', validate(suspendSchema), suspendUser);
router.patch('/users/:id/reactivate', reactivateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/grant-premium', validate(grantPremiumSchema), grantPremium);
router.post('/users/:id/revoke-premium', validate(revokePremiumSchema), revokePremium);

/* Subscriptions & payments */
router.get('/subscriptions', validate(subscriptionListQuerySchema, 'query'), listSubscriptions);
router.get('/payments', validate(paymentListQuerySchema, 'query'), listPayments);
router.get('/payments/:id', getPayment);

/* AI Project Builder monitoring */
router.get('/ai-builder/stats', aiBuilderStats);
router.get('/ai-generations', validate(generationListQuerySchema, 'query'), listGenerations);
router.get('/ai-projects', validate(projectListQuerySchema, 'query'), listAiProjects);
router.get('/ai-usage', listAiUsage);

/* AI usage & analytics */
router.get('/analytics', analytics);

/* Portfolio management */
router.get('/portfolios', validate(portfolioListQuerySchema, 'query'), listPortfolios);
router.get('/portfolios/:id', getPortfolio);
router.patch('/portfolios/:id/unpublish', unpublishPortfolio);
router.delete('/portfolios/:id', deletePortfolio);

/* Blog management */
router.get('/blog', validate(blogListQuerySchema, 'query'), listBlogPosts);
router.patch('/blog/:id/publish', validate(publishSchema), setBlogPublish);
router.delete('/blog/:id', deleteBlogPost);

/* Template management */
router.get('/templates', listTemplates);
router.patch('/templates/:id', validate(templateToggleSchema), setTemplateEnabled);

/* Reports (CSV export) */
router.get('/reports/users.csv', reportUsersCsv);
router.get('/reports/subscriptions.csv', reportSubscriptionsCsv);
router.get('/reports/payments.csv', reportPaymentsCsv);
router.get('/reports/ai-usage.csv', reportAiUsageCsv);
router.get('/reports/projects.csv', reportProjectsCsv);

/* Audit logs & webhooks */
router.get('/audit-logs', validate(auditLogQuerySchema, 'query'), listAuditLogs);
router.get('/webhooks', listWebhooks);

export default router;
