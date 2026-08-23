import User from '../models/User.js';
import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import WeightLog from '../models/WeightLog.js';
import { dayRange, weekRange } from '../utils/date.js';
import { calculateDailyScore } from '../utils/score.js';
import DailySnapshot from '../models/DailySnapshot.js';

export async function getDailyDashboard(req, res) {
  const date = req.query.date || new Date();
  const { start, end } = dayRange(date);
  const week = weekRange(date);
  const [user, meals, water, gymToday, gymWeek, latestWeight] = await Promise.all([
    User.findById(req.user.id),
    Meal.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }),
    WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }),
    GymLog.findOne({ user: req.user.id, completedAt: { $gte: start, $lte: end } }),
    GymLog.countDocuments({ user: req.user.id, completedAt: { $gte: week.start, $lte: week.end } }),
    WeightLog.findOne({ user: req.user.id }).sort({ loggedAt: -1 })
  ]);

  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.totals.calories,
    protein: acc.protein + meal.totals.protein,
    carbs: acc.carbs + meal.totals.carbs,
    fats: acc.fats + meal.totals.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const waterLiters = water.reduce((sum, x) => sum + x.liters, 0);
  const gymRequired = gymWeek < user.weeklyGymGoal;
  const score = calculateDailyScore({ totals, goals: user.macroGoals, waterLiters, waterGoal: user.waterGoalLiters, gymRequired, gymDone: Boolean(gymToday) });

  await DailySnapshot.findOneAndUpdate(
    { user: req.user.id, day: start },
    {
      user: req.user.id, day: start, score, nutrition: totals, waterLiters: Number(waterLiters.toFixed(3)),
      gymDone: Boolean(gymToday), mealCount: meals.length,
      proteinGoalMet: totals.protein >= user.macroGoals.protein * 0.9,
      waterGoalMet: waterLiters >= user.waterGoalLiters * 0.95
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({
    date: start,
    score,
    nutrition: { totals, goals: user.macroGoals },
    water: { liters: Number(waterLiters.toFixed(3)), goalLiters: user.waterGoalLiters },
    meals: { count: meals.length, entries: meals },
    gym: { doneToday: Boolean(gymToday), completedThisWeek: gymWeek, weeklyGoal: user.weeklyGymGoal },
    latestWeight
  });
}
