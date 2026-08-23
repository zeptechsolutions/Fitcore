import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { cancelChallenge, createChallenge, getChallenges, updateChallengeProgress } from '../controllers/challengeController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getChallenges)).post(asyncHandler(createChallenge));
router.patch('/:id/progress', asyncHandler(updateChallengeProgress));
router.patch('/:id/cancel', asyncHandler(cancelChallenge));
export default router;
