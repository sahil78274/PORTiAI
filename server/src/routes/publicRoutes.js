import { Router } from 'express';
import { getPublicPortfolio, listPublicPosts, getPublicPost } from '../controllers/publicController.js';
import { publicLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/:slug/blog/:postSlug', publicLimiter, getPublicPost);
router.get('/:slug/blog', publicLimiter, listPublicPosts);
router.get('/:slug', publicLimiter, getPublicPortfolio);

export default router;
