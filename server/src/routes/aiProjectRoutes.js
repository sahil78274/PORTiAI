import { Router } from 'express';
import {
  generate,
  listProjects,
  getProject,
  regenerateProject,
  regenerateProjectFile,
  saveProjectFile,
  downloadProject,
  addToPortfolio,
  deleteProject,
  credits,
  meta,
} from '../controllers/aiProjectController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Every route is authenticated; premium is enforced per-route in the
// controller so a free account receives 403 PREMIUM_REQUIRED from the API.
router.use(requireAuth, aiLimiter);

router.get('/meta', meta);
router.get('/credits', credits);
router.get('/', listProjects);
router.post('/generate', generate);
router.get('/:id', getProject);
router.post('/:id/regenerate', regenerateProject);
router.post('/:id/files/regenerate', regenerateProjectFile);
router.patch('/:id/files', saveProjectFile);
router.get('/:id/download', downloadProject);
router.post('/:id/add-to-portfolio', addToPortfolio);
router.delete('/:id', deleteProject);

export default router;
