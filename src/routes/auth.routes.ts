import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authenticate, getProfile);

export default router;