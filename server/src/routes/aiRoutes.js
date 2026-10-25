import { Router } from 'express';
import { generate, improve, analyze, aiStatus } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateRequestSchema, improveRequestSchema, analyzeRequestSchema } from '../validators/portfolioInput.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(requireAuth, aiLimiter);

router.get('/status', aiStatus);
router.post('/generate', validate(generateRequestSchema), generate);
router.post('/improve', validate(improveRequestSchema), improve);
router.post('/analyze', validate(analyzeRequestSchema), analyze);

export default router;
