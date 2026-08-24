import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

function rowMeters(row) {
  if (Number.isFinite(Number(row.distanceMeters))) return Number(row.distanceMeters);
  if (Number.isFinite(Number(row.distanceKm))) return Number(row.distanceKm) * 1000;
  return 0;
}

export async function addActivity(req, res) {
  const kmInput = req.body.distanceKm ?? req.body.kilometers;
  const meters = kmInput !== undefined ? Number(kmInput) * 1000 : Number(req.body.meters ?? req.body.distanceMeters);
  if (!Number.isFinite(meters) || meters < 0) return res.status(400).json({ message: 'Ingresá una distancia válida en kilómetros' });
  const user = await User.findById(req.user.id);
  const loggedAt = req.body.loggedAt ? new Date(req.body.loggedAt) : new Date();
  const { start, end } = dayRange(loggedAt);
  const log = await ActivityLog.findOneAndUpdate(
    { user: req.user.id, loggedAt: { $gte: start, $lte: end } },
    { user: req.user.id, distanceMeters: meters, distanceKm: Number((meters / 1000).toFixed(3)), loggedAt },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );
  await awardXp(req.user.id, meters >= (user?.dailyDistanceGoalMeters || 5000) ? 8 : 2);
  res.status(201).json({ ...log.toObject(), meters: rowMeters(log) });
}

export async function getActivity(req, res) {
  const { start, end } = dayRange(req.query.date || new Date());
  const logs = await ActivityLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const meters = logs.reduce((sum, row) => sum + rowMeters(row), 0);
  res.json({ meters: Math.round(meters), distanceKm: Number((meters / 1000).toFixed(3)), logs: logs.map(x => ({ ...x.toObject(), meters: rowMeters(x) })) });
}

export async function deleteActivity(req, res) {
  const row = await ActivityLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!row) return res.status(404).json({ message: 'Activity log not found' });
  res.status(204).end();
}
