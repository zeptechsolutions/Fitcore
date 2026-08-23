import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getDailyDashboard } from '../controllers/dashboardController.js';

const router = Router();
router.use(requireAuth);
router.get('/daily', asyncHandler(getDailyDashboard));
export default router;
