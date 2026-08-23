import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { addSleep, deleteSleep, getSleep } from '../controllers/sleepController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getSleep)).post(asyncHandler(addSleep));
router.delete('/:id', asyncHandler(deleteSleep));
export default router;
