import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import WeightLog from '../models/WeightLog.js';
import DailySnapshot from '../models/DailySnapshot.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import SleepLog from '../models/SleepLog.js';
import { dayRange, weekRange } from '../utils/date.js';
import { consecutiveDays } from '../utils/streaks.js';
import { kgToLb } from '../utils/weight.js';

function monthRange(dateInput = new Date()) {
  const d = new Date(dateInput);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function rangeFor(period, date) {
  if (period === 'month') return monthRange(date);
  if (period === 'week') return weekRange(date);
  if (period === 'custom') return null;
  return weekRange(date);
}

export async function getSummary(req, res) {
  const period = req.query.period || 'week';
  let range = rangeFor(period, req.query.date || new Date());
  if (period === 'custom') {
    if (!req.query.from || !req.query.to) return res.status(400).json({ message: 'from and to are required for custom period' });
    range = { start: new Date(req.query.from), end: new Date(req.query.to) };
  }

  const [snapshots, weights, activity, sleep, user] = await Promise.all([
    DailySnapshot.find({ user: req.user.id, day: { $gte: range.start, $lte: range.end } }).sort({ day: 1 }),
    WeightLog.find({ user: req.user.id, loggedAt: { $gte: range.start, $lte: range.end } }).sort({ loggedAt: 1 }),
    ActivityLog.find({ user: req.user.id, loggedAt: { $gte: range.start, $lte: range.end } }),
    SleepLog.find({ user: req.user.id, loggedAt: { $gte: range.start, $lte: range.end } }),
    User.findById(req.user.id)
  ]);

  const days = snapshots.length;
  const sums = snapshots.reduce((a, x) => ({
    score: a.score + x.score,
    calories: a.calories + x.nutrition.calories,
    protein: a.protein + x.nutrition.protein,
    carbs: a.carbs + x.nutrition.carbs,
    fats: a.fats + x.nutrition.fats,
    water: a.water + x.waterLiters,
    gym: a.gym + (x.gymDone ? 1 : 0),
    proteinMet: a.proteinMet + (x.proteinGoalMet ? 1 : 0),
    waterMet: a.waterMet + (x.waterGoalMet ? 1 : 0)
  }), { score:0, calories:0, protein:0, carbs:0, fats:0, water:0, gym:0, proteinMet:0, waterMet:0 });

  const activityDays = new Map();
  for (const row of activity) {
    const key = dayRange(row.loggedAt).start.getTime();
    const v = activityDays.get(key) || { steps: 0, distanceKm: 0 };
    v.steps += row.steps;
    v.distanceKm += row.distanceKm;
    activityDays.set(key, v);
  }
  const sleepDays = new Map();
  for (const row of sleep) {
    const key = dayRange(row.loggedAt).start.getTime();
    sleepDays.set(key, (sleepDays.get(key) || 0) + row.hours);
  }
  const activeDays = activityDays.size;
  const sleepTrackedDays = sleepDays.size;
  const totalSteps = [...activityDays.values()].reduce((sum, x) => sum + x.steps, 0);
  const totalDistanceKm = [...activityDays.values()].reduce((sum, x) => sum + x.distanceKm, 0);
  const totalSleepHours = [...sleepDays.values()].reduce((sum, x) => sum + x, 0);
  const stepGoalDays = [...activityDays.values()].filter(x => x.steps >= (user?.dailyStepGoal || 10000)).length;
  const sleepGoalDays = [...sleepDays.values()].filter(x => x >= (user?.sleepGoalHours || 8) * 0.95).length;

  const avg = (value) => days ? Number((value / days).toFixed(1)) : 0;
  res.json({
    period,
    from: range.start,
    to: range.end,
    trackedDays: days,
    averages: {
      score: avg(sums.score), calories: avg(sums.calories), protein: avg(sums.protein),
      carbs: avg(sums.carbs), fats: avg(sums.fats), waterLiters: avg(sums.water),
      steps: activeDays ? Math.round(totalSteps / activeDays) : 0,
      distanceKm: activeDays ? Number((totalDistanceKm / activeDays).toFixed(2)) : 0,
      sleepHours: sleepTrackedDays ? Number((totalSleepHours / sleepTrackedDays).toFixed(2)) : 0
    },
    totals: { steps: totalSteps, distanceKm: Number(totalDistanceKm.toFixed(2)), sleepHours: Number(totalSleepHours.toFixed(2)) },
    completions: { gymDays: sums.gym, proteinGoalDays: sums.proteinMet, waterGoalDays: sums.waterMet, stepGoalDays, sleepGoalDays },
    weight: weights.length ? {
      firstLb: kgToLb(weights[0].weightKg),
      lastLb: kgToLb(weights.at(-1).weightKg),
      changeLb: kgToLb(weights.at(-1).weightKg - weights[0].weightKg, 2)
    } : null
  });
}

export async function getCalendar(req, res) {
  const { start, end } = monthRange(req.query.date || new Date());
  const rows = await DailySnapshot.find({ user: req.user.id, day: { $gte: start, $lte: end } }).sort({ day: 1 });
  res.json(rows.map((x) => ({
    date: x.day,
    score: x.score,
    calories: x.nutrition.calories,
    protein: x.nutrition.protein,
    waterLiters: x.waterLiters,
    steps: x.steps || 0,
    distanceKm: x.distanceKm || 0,
    sleepHours: x.sleepHours || 0,
    gymDone: x.gymDone,
    mealCount: x.mealCount
  })));
}

export async function getStreaks(req, res) {
  const user = await User.findById(req.user.id);
  const since = new Date();
  since.setDate(since.getDate() - 365);
  const [meals, water, gym, snapshots, activity, sleep] = await Promise.all([
    Meal.find({ user: req.user.id, loggedAt: { $gte: since } }).select('loggedAt'),
    WaterLog.find({ user: req.user.id, loggedAt: { $gte: since } }).select('loggedAt liters'),
    GymLog.find({ user: req.user.id, completedAt: { $gte: since } }).select('completedAt'),
    DailySnapshot.find({ user: req.user.id, day: { $gte: since } }).select('day proteinGoalMet waterGoalMet score'),
    ActivityLog.find({ user: req.user.id, loggedAt: { $gte: since } }).select('loggedAt steps'),
    SleepLog.find({ user: req.user.id, loggedAt: { $gte: since } }).select('loggedAt hours')
  ]);

  const uniqueMealDays = [...new Map(meals.map(x => [dayRange(x.loggedAt).start.getTime(), dayRange(x.loggedAt).start])).values()];
  const proteinDays = snapshots.filter(x => x.proteinGoalMet).map(x => x.day);
  const waterDays = snapshots.filter(x => x.waterGoalMet).map(x => x.day);
  const scoreDays = snapshots.filter(x => x.score >= 80).map(x => x.day);

  const weekKeys = new Map();
  for (const log of gym) {
    const { start } = weekRange(log.completedAt);
    const key = start.getTime();
    weekKeys.set(key, (weekKeys.get(key) || 0) + 1);
  }
  const completedWeeks = [...weekKeys.entries()].filter(([, count]) => count >= user.weeklyGymGoal).map(([ts]) => new Date(Number(ts)));

  let gymWeeks = 0;
  let cursor = weekRange(new Date()).start;
  const completedSet = new Set(completedWeeks.map(d => d.getTime()));
  while (completedSet.has(cursor.getTime())) {
    gymWeeks += 1;
    const prev = new Date(cursor); prev.setDate(prev.getDate() - 7); cursor = prev;
  }

  const activityByDay = new Map();
  for (const row of activity) {
    const key = dayRange(row.loggedAt).start.getTime();
    activityByDay.set(key, (activityByDay.get(key) || 0) + row.steps);
  }
  const sleepByDay = new Map();
  for (const row of sleep) {
    const key = dayRange(row.loggedAt).start.getTime();
    sleepByDay.set(key, (sleepByDay.get(key) || 0) + row.hours);
  }
  const stepDays = [...activityByDay.entries()].filter(([, steps]) => steps >= (user.dailyStepGoal || 10000)).map(([ts]) => new Date(Number(ts)));
  const sleepDays = [...sleepByDay.entries()].filter(([, hours]) => hours >= (user.sleepGoalHours || 8) * 0.95).map(([ts]) => new Date(Number(ts)));

  res.json({
    mealLoggingDays: consecutiveDays(uniqueMealDays),
    proteinGoalDays: consecutiveDays(proteinDays),
    waterGoalDays: consecutiveDays(waterDays),
    score80Days: consecutiveDays(scoreDays),
    stepGoalDays: consecutiveDays(stepDays),
    sleepGoalDays: consecutiveDays(sleepDays),
    gymGoalWeeks: gymWeeks
  });
}
