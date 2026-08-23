import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { analyzeRecipeNutrition, createRecipe, deleteRecipe, getRecipes, updateRecipe } from '../controllers/recipeController.js';

const router = Router();
router.use(requireAuth);
router.route('/').get(asyncHandler(getRecipes)).post(asyncHandler(createRecipe));
router.post('/analyze', asyncHandler(analyzeRecipeNutrition));
router.route('/:id').patch(asyncHandler(updateRecipe)).delete(asyncHandler(deleteRecipe));
export default router;
