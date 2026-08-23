import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

function estimatedStrideCm(user) {
  // Distance is estimated automatically from height; users do not configure stride.
  if (Number(user?.heightCm) > 0) return Number(user.heightCm) * 0.415;
  return 70;
}

export async function addActivity(req, res) {
  const steps = Number(req.body.steps);
  if (!Number.isFinite(steps) || steps < 0) return res.status(400).json({ message: 'steps must be a non-negative number' });
  const user = await User.findById(req.user.id);
  const strideCm = estimatedStrideCm(user);
  const distanceKm = Number.isFinite(Number(req.body.distanceKm))
    ? Number(req.body.distanceKm)
    : Number(((steps * strideCm) / 100000).toFixed(3));
  const loggedAt = req.body.loggedAt ? new Date(req.body.loggedAt) : new Date();
  const { start, end } = dayRange(loggedAt);
  const log = await ActivityLog.findOneAndUpdate(
    { user: req.user.id, loggedAt: { $gte: start, $lte: end } },
    { user: req.user.id, steps, distanceKm, loggedAt },
    { new: true, upsert: true, runValidators: true }
  );
  await awardXp(req.user.id, steps >= (user?.dailyStepGoal || 10000) ? 8 : 2);
  res.status(201).json(log);
}

export async function getActivity(req, res) {
  const { start, end } = dayRange(req.query.date || new Date());
  const logs = await ActivityLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const totals = logs.reduce((acc, row) => ({ steps: acc.steps + row.steps, distanceKm: acc.distanceKm + row.distanceKm }), { steps: 0, distanceKm: 0 });
  res.json({ steps: totals.steps, distanceKm: Number(totals.distanceKm.toFixed(3)), logs });
}

export async function deleteActivity(req, res) {
  const row = await ActivityLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!row) return res.status(404).json({ message: 'Activity log not found' });
  res.status(204).end();
}
