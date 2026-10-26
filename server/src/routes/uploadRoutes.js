import { Router } from 'express';
import { createUpload, getUpload } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Reading an uploaded image is public: it is used on published portfolios.
router.get('/:id', getUpload);

router.post('/', requireAuth, createUpload);

export default router;
