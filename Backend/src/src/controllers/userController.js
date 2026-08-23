import User from '../models/User.js';
import WeightLog from '../models/WeightLog.js';

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function updateMe(req, res) {
  const allowed = ['name','birthDate','heightCm','startingWeightKg','targetWeightKg','currentWeightKg','avatarId','goal','activityLevel','macroGoals','waterGoalLiters','bottleSizeLiters','weeklyGymGoal','dailyStepGoal','sleepGoalHours','strideLengthCm','privacy'];
  const current = await User.findById(req.user.id);
  const changes = {};
  for (const key of allowed) if (req.body[key] !== undefined) changes[key] = req.body[key];

  const nextWeight = Number(req.body.currentWeightKg);
  if (Number.isFinite(nextWeight) && nextWeight > 0 && nextWeight !== Number(current?.currentWeightKg)) {
    await WeightLog.create({ user: req.user.id, weightKg: nextWeight, loggedAt: new Date() });
  }

  const user = await User.findByIdAndUpdate(req.user.id, changes, { new: true, runValidators: true });
  res.json(user);
}

export async function getBmi(req, res) {
  const user = await User.findById(req.user.id);
  if (!user?.heightCm) return res.status(400).json({ message: 'Height is required to calculate BMI' });
  const latest = await WeightLog.findOne({ user: req.user.id }).sort({ loggedAt: -1 });
  const weight = latest?.weightKg ?? user.currentWeightKg ?? user.startingWeightKg;
  if (!weight) return res.status(400).json({ message: 'Weight is required to calculate BMI' });
  const bmi = weight / ((user.heightCm / 100) ** 2);
  res.json({ weightKg: weight, heightCm: user.heightCm, bmi: Number(bmi.toFixed(1)) });
}
