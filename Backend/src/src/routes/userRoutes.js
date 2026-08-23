import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getBmi, getMe, updateMe } from '../controllers/userController.js';

const router = Router();
router.use(requireAuth);
router.get('/me', asyncHandler(getMe));
router.patch('/me', asyncHandler(updateMe));
router.get('/me/bmi', asyncHandler(getBmi));
export default router;
