import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getCalendar, getStreaks, getSummary } from '../controllers/statsController.js';

const router = Router();
router.use(requireAuth);
router.get('/summary', asyncHandler(getSummary));
router.get('/calendar', asyncHandler(getCalendar));
router.get('/streaks', asyncHandler(getStreaks));
export default router;
