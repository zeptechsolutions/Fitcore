import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { addWater, deleteWater, getWater, subtractWater } from '../controllers/waterController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getWater)).post(asyncHandler(addWater));
router.post('/subtract', asyncHandler(subtractWater));
router.delete('/:id', asyncHandler(deleteWater));
export default router;
