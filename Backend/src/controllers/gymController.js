import GymLog from '../models/GymLog.js';
import User from '../models/User.js';
import { weekRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

export async function addGym(req, res) {
  const log = await GymLog.create({ user: req.user.id, title: req.body.title, notes: req.body.notes, completedAt: req.body.completedAt });
  await awardXp(req.user.id, 15);
  res.status(201).json(log);
}

export async function getGymWeek(req, res) {
  const { start, end } = weekRange(req.query.date || new Date());
  const logs = await GymLog.find({ user: req.user.id, completedAt: { $gte: start, $lte: end } }).sort({ completedAt: 1 });
  const user = await User.findById(req.user.id);
  res.json({ completed: logs.length, goal: user.weeklyGymGoal, logs });
}

export async function deleteGym(req, res) {
  const log = await GymLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Gym log not found' });
  res.status(204).end();
}
