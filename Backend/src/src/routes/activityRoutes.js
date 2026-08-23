import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { addActivity, deleteActivity, getActivity } from '../controllers/activityController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getActivity)).post(asyncHandler(addActivity));
router.delete('/:id', asyncHandler(deleteActivity));
export default router;
