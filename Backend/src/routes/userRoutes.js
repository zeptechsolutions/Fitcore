import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getBmi, getMe, updateMe, getPersonalPlan, recalculatePersonalPlan } from '../controllers/userController.js';

const router = Router();
router.use(requireAuth);
router.get('/me', asyncHandler(getMe));
router.patch('/me', asyncHandler(updateMe));
router.get('/me/bmi', asyncHandler(getBmi));
router.get('/me/plan', asyncHandler(getPersonalPlan));
router.post('/me/plan/recalculate', asyncHandler(recalculatePersonalPlan));
export default router;
