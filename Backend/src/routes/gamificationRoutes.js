import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getGamification } from '../controllers/gamificationController.js';

const router = Router();
router.use(requireAuth);
router.get('/me', asyncHandler(getGamification));
export default router;
