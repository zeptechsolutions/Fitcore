import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { login, register, requestPasswordReset, verifyPasswordResetCode, resetPassword } from '../controllers/authController.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/password/forgot', asyncHandler(requestPasswordReset));
router.post('/password/verify-code', asyncHandler(verifyPasswordResetCode));
router.post('/password/reset', asyncHandler(resetPassword));
export default router;
