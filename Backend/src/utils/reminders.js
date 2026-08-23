import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import DailySnapshot from '../models/DailySnapshot.js';
import { dayRange, weekRange } from './date.js';

function sumNutrition(meals) {
  return meals.reduce((acc, meal) => ({
    calories: acc.calories + Number(meal.totals?.calories || 0), protein: acc.protein + Number(meal.totals?.protein || 0),
    carbs: acc.carbs + Number(meal.totals?.carbs || 0), fats: acc.fats + Number(meal.totals?.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
}

export async function buildDueReminders(user, now = new Date()) {
  const prefs = user.notificationPreferences;
  if (!prefs?.enabled) return [];
  const { start, end } = dayRange(now); const week = weekRange(now);
  const [meals, water, gymCount, latestSnapshot] = await Promise.all([
    Meal.find({ user: user._id, loggedAt: { $gte: start, $lte: end } }).lean(),
    WaterLog.find({ user: user._id, loggedAt: { $gte: start, $lte: end } }).lean(),
    GymLog.countDocuments({ user: user._id, completedAt: { $gte: week.start, $lte: week.end } }),
    DailySnapshot.findOne({ user: user._id }).sort({ day: -1 }).lean()
  ]);
  const reminders=[]; const nutrition=sumNutrition(meals); const waterLiters=water.reduce((s,r)=>s+Number(r.liters||0),0); const hour=now.getHours();
  if (prefs.mealReminder && hour >= 13 && !meals.some(m => m.type === 'lunch')) reminders.push({ type:'meal', message:'No has registrado tu almuerzo.' });
  if (prefs.mealReminder && hour >= 20 && !meals.some(m => m.type === 'dinner')) reminders.push({ type:'meal', message:'No has registrado tu cena.' });
  if (prefs.waterReminder && user.waterGoalLiters > 0 && waterLiters < user.waterGoalLiters * 0.6 && hour >= 15) reminders.push({ type:'water', message:`Llevas ${waterLiters.toFixed(2)} L de ${user.waterGoalLiters} L de agua.` });
  if (prefs.proteinReminder && user.macroGoals?.protein > 0 && nutrition.protein < user.macroGoals.protein * 0.75 && hour >= 18) reminders.push({ type:'protein', message:`Te faltan aproximadamente ${Math.max(0,user.macroGoals.protein-nutrition.protein).toFixed(0)} g de proteína para tu objetivo.` });
  if (prefs.gymReminder && user.weeklyGymGoal > 0 && gymCount < user.weeklyGymGoal && [5,6,0].includes(now.getDay())) reminders.push({ type:'gym', message:`Llevas ${gymCount}/${user.weeklyGymGoal} entrenamientos esta semana.` });
  if (prefs.streakReminder && latestSnapshot && latestSnapshot.score >= 80 && hour >= 19) reminders.push({ type:'streak', message:'Tu día va bien. Completa tus registros para mantener tu consistencia.' });
  return reminders.map(r=>({...r,priority:'normal'}));
}
