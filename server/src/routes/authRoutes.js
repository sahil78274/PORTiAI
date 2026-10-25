import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  updateAccount,
  deleteAccount,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema, updateAccountSchema } from '../validators/authInput.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.patch('/account', requireAuth, validate(updateAccountSchema), updateAccount);
router.delete('/account', requireAuth, deleteAccount);

export default router;
