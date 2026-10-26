import { Router } from 'express';
import { scanPortfolioUrl, scanPortfolioHtml } from '../controllers/scanController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { scanLimiter } from '../middleware/rateLimit.js';
import { scanUrlSchema, scanHtmlSchema } from '../validators/portfolioInput.js';

const router = Router();

router.use(requireAuth, scanLimiter);

router.post('/url', validate(scanUrlSchema), scanPortfolioUrl);
router.post('/html', validate(scanHtmlSchema), scanPortfolioHtml);

export default router;
