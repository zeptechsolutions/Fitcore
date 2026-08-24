import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { addGym, deleteGym, getGymWeek, getGymHistory, getGymProgress } from '../controllers/gymController.js';

const router = Router();
router.use(requireAuth);
router.get('/history', asyncHandler(getGymHistory));
router.get('/progress', asyncHandler(getGymProgress));
router.route('/').get(asyncHandler(getGymWeek)).post(asyncHandler(addGym));
router.delete('/:id', asyncHandler(deleteGym));
export default router;
