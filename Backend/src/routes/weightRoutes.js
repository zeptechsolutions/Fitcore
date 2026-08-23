import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { addWeight, deleteWeight, getWeights } from '../controllers/weightController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getWeights)).post(asyncHandler(addWeight));
router.delete('/:id', asyncHandler(deleteWeight));
export default router;
