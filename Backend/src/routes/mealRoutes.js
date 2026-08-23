import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { createMeal, deleteMeal, getMeals, updateMeal } from '../controllers/mealController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getMeals)).post(asyncHandler(createMeal));
router.route('/:id').patch(asyncHandler(updateMeal)).delete(asyncHandler(deleteMeal));
export default router;
