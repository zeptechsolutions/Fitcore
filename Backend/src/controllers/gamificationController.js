import Meal from '../models/Meal.js';
import WaterLog from '../models/WaterLog.js';
import GymLog from '../models/GymLog.js';
import Recipe from '../models/Recipe.js';
import DailySnapshot from '../models/DailySnapshot.js';
import User from '../models/User.js';
import { levelFromXp, xpForNextLevel } from '../utils/gamification.js';

const badges = [
  { key:'first_day', name:'El comienzo', icon:'🌱', description:'Completa tu primer día de seguimiento.' },
  { key:'logger_30', name:'Consistente', icon:'🔥', description:'Registra actividad en 30 días diferentes.' },
  { key:'hydration_30', name:'Hidrohomie', icon:'💧', description:'Cumple tu meta de agua 30 días.' },
  { key:'protein_50', name:'Protein Machine', icon:'🥩', description:'Cumple tu proteína 50 días.' },
  { key:'gym_50', name:'Gym Rat', icon:'🏋️', description:'Completa 50 entrenamientos.' },
  { key:'chef_10', name:'Chef', icon:'👨‍🍳', description:'Crea 10 recetas.' },
  { key:'elite_7', name:'Elite', icon:'⭐', description:'Consigue score 90+ en 7 días.' }
];

export async function getGamification(req, res) {
  const [user, meals, waterDays, proteinDays, gymCount, recipeCount, eliteDays, snapshots] = await Promise.all([
    User.findById(req.user.id),
    Meal.distinct('loggedAt', { user: req.user.id }),
    DailySnapshot.countDocuments({ user: req.user.id, waterGoalMet: true }),
    DailySnapshot.countDocuments({ user: req.user.id, proteinGoalMet: true }),
    GymLog.countDocuments({ user: req.user.id }),
    Recipe.countDocuments({ user: req.user.id }),
    DailySnapshot.countDocuments({ user: req.user.id, score: { $gte: 90 } }),
    DailySnapshot.countDocuments({ user: req.user.id })
  ]);

  const earned = new Set();
  if (snapshots >= 1) earned.add('first_day');
  const mealDaySet = new Set(meals.map(d => new Date(d).toISOString().slice(0,10)));
  if (mealDaySet.size >= 30) earned.add('logger_30');
  if (waterDays >= 30) earned.add('hydration_30');
  if (proteinDays >= 50) earned.add('protein_50');
  if (gymCount >= 50) earned.add('gym_50');
  if (recipeCount >= 10) earned.add('chef_10');
  if (eliteDays >= 7) earned.add('elite_7');

  const level = levelFromXp(user.xp);
  if (user.level !== level) { user.level = level; await user.save(); }
  res.json({
    xp: user.xp,
    level,
    nextLevelXp: xpForNextLevel(level),
    achievements: badges.map(x => ({ ...x, earned: earned.has(x.key) }))
  });
}
