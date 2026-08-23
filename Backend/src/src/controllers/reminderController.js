import User from '../models/User.js';
import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import DailySnapshot from '../models/DailySnapshot.js';
import { dayRange, weekRange } from '../utils/date.js';

function sumNutrition(meals) {
  return meals.reduce((acc, meal) => ({
    calories: acc.calories + Number(meal.totals?.calories || 0),
    protein: acc.protein + Number(meal.totals?.protein || 0),
    carbs: acc.carbs + Number(meal.totals?.carbs || 0),
    fats: acc.fats + Number(meal.totals?.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

export async function getReminderPreferences(req, res) {
  const user = await User.findById(req.user.id).select('notificationPreferences');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user.notificationPreferences);
}

export async function updateReminderPreferences(req, res) {
  const allowed = ['enabled','mealReminder','waterReminder','proteinReminder','gymReminder','streakReminder','quietHours'];
  const prefs = {};
  for (const key of allowed) if (req.body[key] !== undefined) prefs[key] = req.body[key];
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.notificationPreferences = { ...user.notificationPreferences.toObject(), ...prefs };
  await user.save();
  res.json(user.notificationPreferences);
}

export async function getDueReminders(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const prefs = user.notificationPreferences;
  if (!prefs?.enabled) return res.json([]);

  const now = new Date();
  const { start, end } = dayRange(now);
  const week = weekRange(now);
  const [meals, water, gymCount, latestSnapshot] = await Promise.all([
    Meal.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).lean(),
    WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).lean(),
    GymLog.countDocuments({ user: req.user.id, completedAt: { $gte: week.start, $lte: week.end } }),
    DailySnapshot.findOne({ user: req.user.id }).sort({ day: -1 }).lean()
  ]);

  const reminders = [];
  const nutrition = sumNutrition(meals);
  const waterLiters = water.reduce((sum, row) => sum + Number(row.liters || 0), 0);
  const hour = now.getHours();

  if (prefs.mealReminder && hour >= 13 && !meals.some(m => m.type === 'lunch')) {
    reminders.push({ type: 'meal', priority: 'normal', message: 'No has registrado tu almuerzo.' });
  }
  if (prefs.mealReminder && hour >= 20 && !meals.some(m => m.type === 'dinner')) {
    reminders.push({ type: 'meal', priority: 'normal', message: 'No has registrado tu cena.' });
  }
  if (prefs.waterReminder && user.waterGoalLiters > 0 && waterLiters < user.waterGoalLiters * 0.6 && hour >= 15) {
    reminders.push({ type: 'water', priority: 'normal', message: `Llevas ${waterLiters.toFixed(2)} L de ${user.waterGoalLiters} L de agua.` });
  }
  if (prefs.proteinReminder && user.macroGoals?.protein > 0 && nutrition.protein < user.macroGoals.protein * 0.75 && hour >= 18) {
    const missing = Math.max(0, user.macroGoals.protein - nutrition.protein);
    reminders.push({ type: 'protein', priority: 'normal', message: `Te faltan aproximadamente ${missing.toFixed(0)} g de proteína para tu objetivo.` });
  }
  if (prefs.gymReminder && user.weeklyGymGoal > 0 && gymCount < user.weeklyGymGoal && [5,6,0].includes(now.getDay())) {
    reminders.push({ type: 'gym', priority: 'normal', message: `Llevas ${gymCount}/${user.weeklyGymGoal} entrenamientos esta semana.` });
  }
  if (prefs.streakReminder && latestSnapshot && latestSnapshot.score >= 80 && hour >= 19) {
    reminders.push({ type: 'streak', priority: 'low', message: 'Tu día va bien. Completa tus registros para mantener tu consistencia.' });
  }

  res.json(reminders);
}
