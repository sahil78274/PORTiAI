import { Router } from 'express';
import {
  listPosts,
  createPost,
  getPost,
  updatePost,
  setPublishState,
  deletePost,
} from '../controllers/blogController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { blogPostSchema, blogUpdateSchema, publishSchema } from '../validators/blogInput.js';

const router = Router();

router.use(requireAuth);

router.get('/', listPosts);
router.post('/', validate(blogPostSchema), createPost);
router.get('/:id', getPost);
router.put('/:id', validate(blogUpdateSchema), updatePost);
router.patch('/:id/publish', validate(publishSchema), setPublishState);
router.delete('/:id', deletePost);

export default router;
