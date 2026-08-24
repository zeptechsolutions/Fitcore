import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import WeightLog from '../models/WeightLog.js';
import { dayRange } from '../utils/date.js';
import { kgToLb, lbToKg, withUserWeightLb } from '../utils/weight.js';
import { buildPersonalPlan } from '../utils/plan.js';

async function upsertTodayWeight(userId, weightKg, when = new Date()) {
  const { start, end } = dayRange(when);
  return WeightLog.findOneAndUpdate(
    { user: userId, loggedAt: { $gte: start, $lte: end } },
    { user: userId, weightKg, loggedAt: when },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(withUserWeightLb(user));
}

export async function updateMe(req, res) {
  const allowed = ['name','birthDate','biologicalSex','heightCm','avatarId','goal','activityLevel','macroGoals','waterGoalLiters','weeklyGymGoal','dailyDistanceGoalMeters','sleepGoalHours','privacy','onboardingCompleted'];
  const current = await User.findById(req.user.id);
  const changes = {};
  for (const key of allowed) if (req.body[key] !== undefined) changes[key] = req.body[key];
  if (changes.weeklyGymGoal !== undefined) changes.weeklyGymGoal = Math.max(0, Math.min(7, Number(changes.weeklyGymGoal)));

  const weightPairs = [['startingWeightLb','startingWeightKg'],['currentWeightLb','currentWeightKg'],['targetWeightLb','targetWeightKg']];
  for (const [lbKey,kgKey] of weightPairs) {
    if (req.body[lbKey] !== undefined && req.body[lbKey] !== '') changes[kgKey] = lbToKg(req.body[lbKey]);
    else if (req.body[kgKey] !== undefined) changes[kgKey] = Number(req.body[kgKey]);
  }

  const nextWeightKg = Number(changes.currentWeightKg);
  if (Number.isFinite(nextWeightKg) && nextWeightKg > 0 && Math.abs(nextWeightKg - Number(current?.currentWeightKg || 0)) > 0.0001) {
    await upsertTodayWeight(req.user.id, nextWeightKg);
    if (!current?.startingWeightKg) changes.startingWeightKg = nextWeightKg;
  }

  const user = await User.findByIdAndUpdate(req.user.id, changes, { returnDocument: 'after', runValidators: true });
  res.json(withUserWeightLb(user));
}

export async function changePassword(req,res){
  const currentPassword=String(req.body.currentPassword||'');
  const newPassword=String(req.body.newPassword||'');
  if(newPassword.length<8||newPassword.length>128) return res.status(400).json({message:'La nueva contraseña debe tener al menos 8 caracteres'});
  const user=await User.findById(req.user.id).select('+passwordHash');
  if(!user||!(await bcrypt.compare(currentPassword,user.passwordHash))) return res.status(401).json({message:'La contraseña actual no es correcta'});
  user.passwordHash=await bcrypt.hash(newPassword,12); await user.save();
  res.json({message:'Contraseña actualizada'});
}

export async function getBmi(req, res) {
  const user = await User.findById(req.user.id);
  if (!user?.heightCm) return res.status(400).json({ message: 'Height is required to calculate BMI' });
  const latest = await WeightLog.findOne({ user: req.user.id }).sort({ loggedAt: -1 });
  const weightKg = latest?.weightKg ?? user.currentWeightKg ?? user.startingWeightKg;
  if (!weightKg) return res.status(400).json({ message: 'Weight is required to calculate BMI' });
  const bmi = weightKg / ((user.heightCm / 100) ** 2);
  res.json({ weightLb: kgToLb(weightKg), heightCm: user.heightCm, bmi: Number(bmi.toFixed(1)) });
}

export async function getPersonalPlan(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.personalizedPlan?.generatedAt) {
    const plan = buildPersonalPlan(user);
    user.personalizedPlan = plan;
    user.macroGoals = { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats };
    await user.save();
  }
  res.json(user.personalizedPlan);
}

export async function recalculatePersonalPlan(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const plan = buildPersonalPlan(user);
  user.personalizedPlan = plan;
  if (req.body.applyToMacros !== false) user.macroGoals = { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats };
  await user.save();
  res.json({ plan, user: withUserWeightLb(user) });
}
