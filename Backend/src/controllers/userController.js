import User from '../models/User.js';
import WeightLog from '../models/WeightLog.js';
import { kgToLb, lbToKg, withUserWeightLb } from '../utils/weight.js';
import { buildPersonalPlan } from '../utils/plan.js';

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(withUserWeightLb(user));
}

export async function updateMe(req, res) {
  const allowed = ['name','birthDate','biologicalSex','heightCm','avatarId','goal','activityLevel','macroGoals','waterGoalLiters','bottleSizeLiters','weeklyGymGoal','dailyStepGoal','sleepGoalHours','privacy'];
  const current = await User.findById(req.user.id);
  const changes = {};
  for (const key of allowed) if (req.body[key] !== undefined) changes[key] = req.body[key];

  // Pounds are the public/user-facing unit. Kg fields remain accepted for backward compatibility.
  const weightPairs = [
    ['startingWeightLb', 'startingWeightKg'],
    ['currentWeightLb', 'currentWeightKg'],
    ['targetWeightLb', 'targetWeightKg']
  ];
  for (const [lbKey, kgKey] of weightPairs) {
    if (req.body[lbKey] !== undefined) changes[kgKey] = lbToKg(req.body[lbKey]);
    else if (req.body[kgKey] !== undefined) changes[kgKey] = Number(req.body[kgKey]);
  }

  const nextWeightKg = Number(changes.currentWeightKg);
  if (Number.isFinite(nextWeightKg) && nextWeightKg > 0 && nextWeightKg !== Number(current?.currentWeightKg)) {
    await WeightLog.create({ user: req.user.id, weightKg: nextWeightKg, loggedAt: new Date() });
  }

  const user = await User.findByIdAndUpdate(req.user.id, changes, { new: true, runValidators: true });
  res.json(withUserWeightLb(user));
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
  res.json({ plan: user.personalizedPlan, macroGoals: user.macroGoals });
}
