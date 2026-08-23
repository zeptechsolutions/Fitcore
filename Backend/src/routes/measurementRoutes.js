import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { addMeasurement, deleteMeasurement, getMeasurements } from '../controllers/measurementController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getMeasurements)).post(asyncHandler(addMeasurement));
router.delete('/:id', asyncHandler(deleteMeasurement));
export default router;
