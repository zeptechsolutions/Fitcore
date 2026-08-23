import SleepLog from '../models/SleepLog.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

function calculateHours(sleptAt, wokeAt) {
  const start = new Date(sleptAt);
  const end = new Date(wokeAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  return (end - start) / 3600000;
}

export async function addSleep(req, res) {
  let hours = Number(req.body.hours);
  if ((!Number.isFinite(hours) || hours <= 0) && req.body.sleptAt && req.body.wokeAt) hours = calculateHours(req.body.sleptAt, req.body.wokeAt);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return res.status(400).json({ message: 'Provide valid hours or sleptAt/wokeAt values' });
  const loggedAt = req.body.loggedAt || req.body.wokeAt || new Date();
  const row = await SleepLog.create({
    user: req.user.id,
    sleptAt: req.body.sleptAt || undefined,
    wokeAt: req.body.wokeAt || undefined,
    hours: Number(hours.toFixed(2)),
    notes: req.body.notes,
    loggedAt
  });
  await awardXp(req.user.id, hours >= 7 ? 5 : 2);
  res.status(201).json(row);
}

export async function getSleep(req, res) {
  const { start, end } = dayRange(req.query.date || new Date());
  const logs = await SleepLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const hours = logs.reduce((sum, row) => sum + row.hours, 0);
  res.json({ hours: Number(hours.toFixed(2)), logs });
}

export async function deleteSleep(req, res) {
  const row = await SleepLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!row) return res.status(404).json({ message: 'Sleep log not found' });
  res.status(204).end();
}
