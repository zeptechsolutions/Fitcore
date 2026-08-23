import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { createFavorite, deleteFavorite, getFavorites, logFavorite, updateFavorite } from '../controllers/favoriteController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getFavorites)).post(asyncHandler(createFavorite));
router.post('/:id/log', asyncHandler(logFavorite));
router.route('/:id').patch(asyncHandler(updateFavorite)).delete(asyncHandler(deleteFavorite));
export default router;
