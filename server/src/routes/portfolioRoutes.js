import { Router } from 'express';
import {
  listPortfolios,
  createPortfolio,
  getPortfolio,
  updatePortfolio,
  duplicatePortfolio,
  setPublishState,
  deletePortfolio,
} from '../controllers/portfolioController.js';
import { analyze } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPortfolioSchema } from '../validators/portfolioInput.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(requireAuth);

router.get('/', listPortfolios);
router.post('/', validate(createPortfolioSchema), createPortfolio);
router.get('/:id', getPortfolio);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);
router.post('/:id/duplicate', duplicatePortfolio);
router.patch('/:id/publish', setPublishState);
router.post('/:id/analyze', aiLimiter, analyze);

export default router;
