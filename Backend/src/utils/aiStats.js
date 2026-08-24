import DailySnapshot from '../models/DailySnapshot.js';
import WeightLog from '../models/WeightLog.js';
import Meal from '../models/Meal.js';
import GymLog from '../models/GymLog.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import SleepLog from '../models/SleepLog.js';
import { weekRange } from './date.js';
import { kgToLb } from './weight.js';

export function monthRange(dateInput = new Date()) {
  const date = new Date(dateInput);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function previousRange({ start, end }) {
  const duration = end.getTime() - start.getTime() + 1;
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1)
  };
}

export async function buildPeriodSummary(userId, range) {
  const [user, snapshots, weights, gymCount, activity, sleep] = await Promise.all([
    User.findById(userId).select('macroGoals waterGoalLiters weeklyGymGoal goal dailyDistanceGoalMeters sleepGoalHours'),
    DailySnapshot.find({ user: userId, day: { $gte: range.start, $lte: range.end } }).sort({ day: 1 }).lean(),
    WeightLog.find({ user: userId, loggedAt: { $gte: range.start, $lte: range.end } }).sort({ loggedAt: 1 }).lean(),
    GymLog.countDocuments({ user: userId, completedAt: { $gte: range.start, $lte: range.end } }),
    ActivityLog.find({ user: userId, loggedAt: { $gte: range.start, $lte: range.end } }).lean(),
    SleepLog.find({ user: userId, loggedAt: { $gte: range.start, $lte: range.end } }).lean()
  ]);

  const days = snapshots.length;
  const sums = snapshots.reduce((acc, day) => {
    acc.score += day.score || 0;
    acc.calories += day.nutrition?.calories || 0;
    acc.protein += day.nutrition?.protein || 0;
    acc.carbs += day.nutrition?.carbs || 0;
    acc.fats += day.nutrition?.fats || 0;
    acc.water += day.waterLiters || 0;
    acc.proteinGoalDays += day.proteinGoalMet ? 1 : 0;
    acc.waterGoalDays += day.waterGoalMet ? 1 : 0;
    return acc;
  }, { score: 0, calories: 0, protein: 0, carbs: 0, fats: 0, water: 0, proteinGoalDays: 0, waterGoalDays: 0 });

  const activityDays = new Map();
  for (const row of activity) {
    const key = new Date(row.loggedAt).toISOString().slice(0, 10);
    const value = activityDays.get(key) || { meters: 0 };
    value.meters += Number.isFinite(Number(row.distanceMeters)) ? Number(row.distanceMeters) : Number(row.distanceKm || 0) * 1000;
    activityDays.set(key, value);
  }
  const sleepDays = new Map();
  for (const row of sleep) {
    const key = new Date(row.loggedAt).toISOString().slice(0, 10);
    sleepDays.set(key, (sleepDays.get(key) || 0) + (row.hours || 0));
  }
  const totalMeters = [...activityDays.values()].reduce((sum, x) => sum + x.meters, 0);
  const totalSleepHours = [...sleepDays.values()].reduce((sum, x) => sum + x, 0);

  const avg = (number) => days ? Number((number / days).toFixed(1)) : 0;
  const weight = weights.length ? {
    firstLb: kgToLb(weights[0].weightKg),
    lastLb: kgToLb(weights.at(-1).weightKg),
    changeLb: kgToLb(weights.at(-1).weightKg - weights[0].weightKg, 2)
  } : null;

  return {
    from: range.start.toISOString(),
    to: range.end.toISOString(),
    trackedDays: days,
    goals: user ? {
      physicalGoal: user.goal,
      macros: user.macroGoals,
      waterLiters: user.waterGoalLiters,
      weeklyGym: user.weeklyGymGoal,
      dailyDistanceMeters: user.dailyDistanceGoalMeters || 5000,
      sleepHours: user.sleepGoalHours || 8
    } : null,
    averages: {
      score: avg(sums.score),
      calories: avg(sums.calories),
      protein: avg(sums.protein),
      carbs: avg(sums.carbs),
      fats: avg(sums.fats),
      waterLiters: avg(sums.water),
      distanceMeters: activityDays.size ? Math.round(totalMeters / activityDays.size) : 0,
      distanceKm: activityDays.size ? Number((totalMeters / activityDays.size / 1000).toFixed(2)) : 0,
      sleepHours: sleepDays.size ? Number((totalSleepHours / sleepDays.size).toFixed(2)) : 0
    },
    completions: {
      proteinGoalDays: sums.proteinGoalDays,
      waterGoalDays: sums.waterGoalDays,
      gymSessions: gymCount,
      distanceGoalDays: [...activityDays.values()].filter(x => x.meters >= (user?.dailyDistanceGoalMeters || 5000)).length,
      sleepGoalDays: [...sleepDays.values()].filter(x => x >= (user?.sleepGoalHours || 8) * 0.95).length
    },
    weight
  };
}

export async function buildPatternDataset(userId, days = 30) {
  const safeDays = Math.min(Math.max(Number(days) || 30, 14), 180);
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (safeDays - 1));
  start.setHours(0, 0, 0, 0);

  const [snapshots, weights, activity, sleep] = await Promise.all([
    DailySnapshot.find({ user: userId, day: { $gte: start, $lte: end } }).sort({ day: 1 }).lean(),
    WeightLog.find({ user: userId, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 }).lean(),
    ActivityLog.find({ user: userId, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 }).lean(),
    SleepLog.find({ user: userId, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 }).lean()
  ]);

  const weekday = {};
  for (const row of snapshots) {
    const key = new Date(row.day).toLocaleDateString('en-US', { weekday: 'long' });
    if (!weekday[key]) weekday[key] = { days: 0, calories: 0, protein: 0, water: 0, score: 0, gymDays: 0 };
    weekday[key].days += 1;
    weekday[key].calories += row.nutrition?.calories || 0;
    weekday[key].protein += row.nutrition?.protein || 0;
    weekday[key].water += row.waterLiters || 0;
    weekday[key].score += row.score || 0;
    weekday[key].gymDays += row.gymDone ? 1 : 0;
  }

  const byWeekday = Object.entries(weekday).map(([name, value]) => ({
    weekday: name,
    trackedDays: value.days,
    avgCalories: Number((value.calories / value.days).toFixed(1)),
    avgProtein: Number((value.protein / value.days).toFixed(1)),
    avgWaterLiters: Number((value.water / value.days).toFixed(2)),
    avgScore: Number((value.score / value.days).toFixed(1)),
    gymDays: value.gymDays
  }));

  const gymRows = snapshots.filter(x => x.gymDone);
  const restRows = snapshots.filter(x => !x.gymDone);
  const avgRows = (rows, path) => rows.length ? Number((rows.reduce((sum, x) => sum + path(x), 0) / rows.length).toFixed(1)) : 0;

  return {
    period: { from: start.toISOString(), to: end.toISOString(), requestedDays: safeDays, trackedDays: snapshots.length },
    byWeekday,
    gymVsRest: {
      gymDays: gymRows.length,
      restDays: restRows.length,
      avgCaloriesGym: avgRows(gymRows, x => x.nutrition?.calories || 0),
      avgCaloriesRest: avgRows(restRows, x => x.nutrition?.calories || 0),
      avgProteinGym: avgRows(gymRows, x => x.nutrition?.protein || 0),
      avgProteinRest: avgRows(restRows, x => x.nutrition?.protein || 0),
      avgWaterGym: avgRows(gymRows, x => x.waterLiters || 0),
      avgWaterRest: avgRows(restRows, x => x.waterLiters || 0)
    },
    activityRecovery: {
      totalDistanceMeters: Math.round(activity.reduce((sum, x) => sum + (Number.isFinite(Number(x.distanceMeters)) ? Number(x.distanceMeters) : Number(x.distanceKm || 0) * 1000), 0)),
      totalDistanceKm: Number((activity.reduce((sum, x) => sum + (Number.isFinite(Number(x.distanceMeters)) ? Number(x.distanceMeters) : Number(x.distanceKm || 0) * 1000), 0) / 1000).toFixed(2)),
      totalSleepHours: Number(sleep.reduce((sum, x) => sum + (x.hours || 0), 0).toFixed(2)),
      activityLogs: activity.length,
      sleepLogs: sleep.length
    },
    weight: weights.length >= 2 ? {
      firstLb: kgToLb(weights[0].weightKg),
      lastLb: kgToLb(weights.at(-1).weightKg),
      changeLb: kgToLb(weights.at(-1).weightKg - weights[0].weightKg, 2)
    } : null
  };
}

export async function buildQuestionContext(userId, intent) {
  const now = new Date();
  let start = intent.from ? new Date(intent.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  let end = intent.to ? new Date(intent.to) : now;
  if (Number.isNaN(start.getTime())) start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (Number.isNaN(end.getTime())) end = now;
  if (end < start) [start, end] = [end, start];

  const maxSpan = 366 * 24 * 60 * 60 * 1000;
  if (end - start > maxSpan) start = new Date(end.getTime() - maxSpan);

  const domains = new Set(intent.domains || []);
  const context = { period: { from: start.toISOString(), to: end.toISOString() } };

  if (domains.has('summary') || domains.has('score') || domains.has('water') || domains.has('gym') || domains.has('activity') || domains.has('sleep')) {
    context.summary = await buildPeriodSummary(userId, { start, end });
  }
  if (domains.has('weight')) {
    context.weights = (await WeightLog.find({ user: userId, loggedAt: { $gte: start, $lte: end } })
      .sort({ loggedAt: 1 }).select('weightKg loggedAt -_id').lean()).map((row) => ({ weightLb: kgToLb(row.weightKg), loggedAt: row.loggedAt }));
  }
  if (domains.has('meals') || domains.has('macros')) {
    const meals = await Meal.find({ user: userId, loggedAt: { $gte: start, $lte: end } })
      .sort({ loggedAt: 1 }).select('type title description totals loggedAt -_id').lean();
    context.meals = meals.slice(-200);
  }
  if (domains.has('activity')) {
    context.activity = await ActivityLog.find({ user: userId, loggedAt: { $gte: start, $lte: end } })
      .sort({ loggedAt: 1 }).select('distanceMeters distanceKm loggedAt -_id').lean();
  }
  if (domains.has('sleep')) {
    context.sleep = await SleepLog.find({ user: userId, loggedAt: { $gte: start, $lte: end } })
      .sort({ loggedAt: 1 }).select('hours sleptAt wokeAt loggedAt -_id').lean();
  }
  if (domains.has('gym')) {
    context.gym = await GymLog.find({ user: userId, completedAt: { $gte: start, $lte: end } })
      .sort({ completedAt: 1 }).select('completedAt notes -_id').lean();
  }

  return context;
}

export function currentWeekRange(date = new Date()) {
  return weekRange(date);
}
