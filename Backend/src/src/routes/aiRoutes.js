import { Router } from 'express';
import { requireAuth } from '../utils/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { analyzeMeal, askZhealth, detectPatterns, getAIUsage, weeklySummary } from '../controllers/aiController.js';

const router = Router();
router.use(requireAuth);
router.post('/meals/analyze', asyncHandler(analyzeMeal));
router.get('/weekly-summary', asyncHandler(weeklySummary));
router.get('/patterns', asyncHandler(detectPatterns));
router.post('/ask', asyncHandler(askZhealth));
router.get('/usage', asyncHandler(getAIUsage));

export default router;
