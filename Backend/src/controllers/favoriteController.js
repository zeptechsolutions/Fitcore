import FavoriteMeal from '../models/FavoriteMeal.js';
import Meal from '../models/Meal.js';
import { awardXp } from '../utils/xp.js';

function calculateTotals(items = []) {
  return items.reduce((acc, item) => ({
    calories: acc.calories + Number(item.calories || 0),
    protein: acc.protein + Number(item.protein || 0),
    carbs: acc.carbs + Number(item.carbs || 0),
    fats: acc.fats + Number(item.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

export async function createFavorite(req, res) {
  const { name, defaultType = 'snack', items = [] } = req.body;
  if (!String(name || '').trim()) return res.status(400).json({ message: 'Favorite name is required' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'At least one item is required' });
  const favorite = await FavoriteMeal.create({
    user: req.user.id,
    name: String(name).trim(),
    defaultType,
    items,
    totals: calculateTotals(items)
  });
  res.status(201).json(favorite);
}

export async function getFavorites(req, res) {
  const rows = await FavoriteMeal.find({ user: req.user.id }).sort({ useCount: -1, name: 1 });
  res.json(rows);
}

export async function updateFavorite(req, res) {
  const allowed = ['name', 'defaultType', 'items'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.items) update.totals = calculateTotals(update.items);
  const row = await FavoriteMeal.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id }, update,
    { new: true, runValidators: true }
  );
  if (!row) return res.status(404).json({ message: 'Favorite not found' });
  res.json(row);
}

export async function deleteFavorite(req, res) {
  const row = await FavoriteMeal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!row) return res.status(404).json({ message: 'Favorite not found' });
  res.status(204).end();
}

export async function logFavorite(req, res) {
  const favorite = await FavoriteMeal.findOne({ _id: req.params.id, user: req.user.id });
  if (!favorite) return res.status(404).json({ message: 'Favorite not found' });
  const type = req.body.type || favorite.defaultType;
  const meal = await Meal.create({
    user: req.user.id,
    type,
    title: favorite.name,
    source: 'manual',
    items: favorite.items,
    totals: favorite.totals,
    loggedAt: req.body.loggedAt
  });
  favorite.useCount += 1;
  favorite.lastUsedAt = new Date();
  await favorite.save();
  await awardXp(req.user.id, 5);
  res.status(201).json(meal);
}
