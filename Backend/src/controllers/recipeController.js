import Recipe from '../models/Recipe.js';
import { awardXp } from '../utils/xp.js';
import { callStructuredAI } from '../utils/ai.js';

const recipeNutritionSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    confidence: { type: 'number' },
    disclaimer: { type: 'string' },
    ingredients: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
      name: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fats: { type: 'number' }
    }, required: ['name','quantity','unit','calories','protein','carbs','fats'] } },
    totals: { type: 'object', additionalProperties: false, properties: { calories:{type:'number'}, protein:{type:'number'}, carbs:{type:'number'}, fats:{type:'number'} }, required:['calories','protein','carbs','fats'] }
  }, required: ['confidence','disclaimer','ingredients','totals']
};

function totals(ingredients = []) {
  return ingredients.reduce((acc, x) => ({
    calories: acc.calories + Number(x.calories || 0), protein: acc.protein + Number(x.protein || 0),
    carbs: acc.carbs + Number(x.carbs || 0), fats: acc.fats + Number(x.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

async function analyzeRecipe(userId, name, description, ingredients) {
  const input = description?.trim() || ingredients.map(i => `${i.quantity || ''} ${i.unit || ''} ${i.name}`.trim()).join(', ');
  if (!input) return null;
  return callStructuredAI({
    userId, feature: 'recipe_analysis', schemaName: 'zhealth_recipe_nutrition', schema: recipeNutritionSchema,
    instructions: 'You are Zhealth recipe nutrition parser. Estimate nutrition for the entire recipe from the supplied ingredients and quantities. Calories are kcal and macros are grams. Use common serving assumptions only when necessary. Values are estimates, not medical precision. Return each ingredient and totals for the whole recipe.',
    input: `${name}: ${input}`
  });
}

export async function analyzeRecipeNutrition(req, res) {
  const name = String(req.body.name || 'Receta').trim();
  const description = String(req.body.description || '').trim();
  const ingredients = Array.isArray(req.body.ingredients) ? req.body.ingredients : [];
  if (!description && !ingredients.length) return res.status(400).json({ message: 'Describe the recipe or add ingredients' });
  res.json(await analyzeRecipe(req.user.id, name, description, ingredients));
}

export async function createRecipe(req, res) {
  const { name, servings = 1, favorite = false } = req.body;
  let ingredients = Array.isArray(req.body.ingredients) ? req.body.ingredients : [];
  if (!name) return res.status(400).json({ message: 'Recipe name is required' });

  let aiEstimate = null;
  if (req.body.analyzeWithAi !== false) {
    aiEstimate = await analyzeRecipe(req.user.id, name, String(req.body.description || ''), ingredients);
    if (aiEstimate?.ingredients?.length) ingredients = aiEstimate.ingredients;
  }
  if (!ingredients.length) return res.status(400).json({ message: 'Add ingredients or a recipe description' });

  const recipe = await Recipe.create({ user: req.user.id, name, servings, ingredients, totals: aiEstimate?.totals || totals(ingredients), favorite, aiEstimated: Boolean(aiEstimate) });
  await awardXp(req.user.id, 10);
  res.status(201).json({ ...recipe.toObject(), ai: aiEstimate ? { confidence: aiEstimate.confidence, disclaimer: aiEstimate.disclaimer } : null });
}

export async function getRecipes(req, res) { res.json(await Recipe.find({ user: req.user.id }).sort({ favorite: -1, name: 1 })); }

export async function updateRecipe(req, res) {
  const allowed = ['name', 'servings', 'ingredients', 'favorite'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.ingredients) update.totals = totals(update.ingredients);
  const recipe = await Recipe.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, { new: true, runValidators: true });
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.json(recipe);
}

export async function deleteRecipe(req, res) {
  const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.status(204).end();
}
