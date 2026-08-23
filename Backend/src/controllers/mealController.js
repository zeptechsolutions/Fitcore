import Meal from '../models/Meal.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

function calculateTotals(items = []) {
  return items.reduce((acc, item) => ({
    calories: acc.calories + Number(item.calories || 0),
    protein: acc.protein + Number(item.protein || 0),
    carbs: acc.carbs + Number(item.carbs || 0),
    fats: acc.fats + Number(item.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

export async function createMeal(req, res) {
  const { type, title, description, source = 'manual', items = [], loggedAt } = req.body;
  if (!type) return res.status(400).json({ message: 'Meal type is required' });
  if (!Array.isArray(items)) return res.status(400).json({ message: 'items must be an array' });
  const meal = await Meal.create({ user: req.user.id, type, title, description, source, items, totals: calculateTotals(items), loggedAt });
  await awardXp(req.user.id, 5);
  res.status(201).json(meal);
}

export async function getMeals(req, res) {
  const filter = { user: req.user.id };
  if (req.query.date) {
    const { start, end } = dayRange(req.query.date);
    filter.loggedAt = { $gte: start, $lte: end };
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  res.json(await Meal.find(filter).sort({ loggedAt: -1 }).limit(limit));
}

export async function updateMeal(req, res) {
  const allowed = ['type', 'title', 'description', 'source', 'items', 'loggedAt'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.items) update.totals = calculateTotals(update.items);
  const meal = await Meal.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id }, update,
    { new: true, runValidators: true }
  );
  if (!meal) return res.status(404).json({ message: 'Meal not found' });
  res.json(meal);
}

export async function deleteMeal(req, res) {
  const meal = await Meal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!meal) return res.status(404).json({ message: 'Meal not found' });
  res.status(204).end();
}
