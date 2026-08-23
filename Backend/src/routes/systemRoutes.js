import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { runScheduledEmails } from '../controllers/systemController.js';
const router = Router();
router.post('/scheduled-emails', asyncHandler(runScheduledEmails));
router.post('/inactivity-emails', asyncHandler(runScheduledEmails));
export default router;
