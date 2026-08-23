import WeightLog from '../models/WeightLog.js';
import { awardXp } from '../utils/xp.js';

export async function addWeight(req, res) {
  const { weightKg, loggedAt } = req.body;
  if (!weightKg) return res.status(400).json({ message: 'weightKg is required' });
  const log = await WeightLog.create({ user: req.user.id, weightKg, loggedAt });
  await awardXp(req.user.id, 3);
  res.status(201).json(log);
}

export async function getWeights(req, res) {
  res.json(await WeightLog.find({ user: req.user.id }).sort({ loggedAt: 1 }));
}

export async function deleteWeight(req, res) {
  const log = await WeightLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Weight log not found' });
  res.status(204).end();
}
