import WeightLog from '../models/WeightLog.js';
import User from '../models/User.js';
import { awardXp } from '../utils/xp.js';
import { lbToKg, withWeightLb } from '../utils/weight.js';

export async function addWeight(req, res) {
  const inputLb = Number(req.body.weightLb);
  const legacyKg = Number(req.body.weightKg);
  const weightKg = Number.isFinite(inputLb) && inputLb > 0 ? lbToKg(inputLb) : legacyKg;
  const { loggedAt } = req.body;
  if (!Number.isFinite(weightKg) || weightKg <= 0) return res.status(400).json({ message: 'weightLb is required' });
  const log = await WeightLog.create({ user: req.user.id, weightKg, loggedAt });
  await User.findByIdAndUpdate(req.user.id, { currentWeightKg: Number(weightKg) }, { runValidators: true });
  await awardXp(req.user.id, 3);
  res.status(201).json(withWeightLb(log));
}

export async function getWeights(req, res) {
  const rows = await WeightLog.find({ user: req.user.id }).sort({ loggedAt: 1 }).lean();
  res.json(rows.map(withWeightLb));
}

export async function deleteWeight(req, res) {
  const log = await WeightLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Weight log not found' });
  res.status(204).end();
}
