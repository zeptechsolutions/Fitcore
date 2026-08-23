import Recipe from '../models/Recipe.js';
import { awardXp } from '../utils/xp.js';

function totals(ingredients = []) {
  return ingredients.reduce((acc, x) => ({
    calories: acc.calories + Number(x.calories || 0), protein: acc.protein + Number(x.protein || 0),
    carbs: acc.carbs + Number(x.carbs || 0), fats: acc.fats + Number(x.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

export async function createRecipe(req, res) {
  const { name, servings = 1, ingredients = [], favorite = false } = req.body;
  if (!name) return res.status(400).json({ message: 'Recipe name is required' });
  if (!Array.isArray(ingredients)) return res.status(400).json({ message: 'ingredients must be an array' });
  const recipe = await Recipe.create({ user: req.user.id, name, servings, ingredients, totals: totals(ingredients), favorite });
  await awardXp(req.user.id, 10);
  res.status(201).json(recipe);
}

export async function getRecipes(req, res) {
  res.json(await Recipe.find({ user: req.user.id }).sort({ favorite: -1, name: 1 }));
}

export async function updateRecipe(req, res) {
  const allowed = ['name', 'servings', 'ingredients', 'favorite'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.ingredients) update.totals = totals(update.ingredients);
  const recipe = await Recipe.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id }, update,
    { new: true, runValidators: true }
  );
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.json(recipe);
}

export async function deleteRecipe(req, res) {
  const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.status(204).end();
}
