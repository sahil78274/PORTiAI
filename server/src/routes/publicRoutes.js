import { Router } from 'express';
import { getPublicPortfolio } from '../controllers/publicController.js';
import { publicLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/:slug', publicLimiter, getPublicPortfolio);

export default router;
