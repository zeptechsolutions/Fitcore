import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getDueReminders, getReminderPreferences, updateReminderPreferences } from '../controllers/reminderController.js';

const router = Router();
router.use(requireAuth);
router.get('/preferences', asyncHandler(getReminderPreferences));
router.patch('/preferences', asyncHandler(updateReminderPreferences));
router.get('/due', asyncHandler(getDueReminders));
export default router;
