import WaterLog from '../models/WaterLog.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

export async function addWater(req, res) {
  const liters = Number(req.body.liters ?? 1);
  if (!Number.isFinite(liters) || liters <= 0 || liters > 10) return res.status(400).json({ message: 'Ingresá una cantidad válida de agua' });
  const log = await WaterLog.create({ user: req.user.id, liters, loggedAt: req.body.loggedAt });
  await awardXp(req.user.id, 2);
  res.status(201).json(log);
}

export async function getWater(req, res) {
  const { start, end } = dayRange(req.query.date || new Date());
  const logs = await WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const liters = logs.reduce((sum, log) => sum + Number(log.liters || 0), 0);
  res.json({ liters: Number(liters.toFixed(3)), logs });
}

export async function deleteWater(req, res) {
  const log = await WaterLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Water log not found' });
  res.status(204).end();
}

export async function subtractWater(req, res) {
  const amount = Number(req.body.liters ?? 1);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10) return res.status(400).json({ message: 'Ingresá una cantidad válida de agua' });
  const { start, end } = dayRange(req.body.date || new Date());
  const logs = await WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: -1 });
  let remaining = amount;
  for (const log of logs) {
    if (remaining <= 0.0001) break;
    const value = Number(log.liters || 0);
    if (value <= remaining + 0.0001) {
      remaining -= value;
      await WaterLog.deleteOne({ _id: log._id, user: req.user.id });
    } else {
      log.liters = Number((value - remaining).toFixed(3));
      remaining = 0;
      await log.save();
    }
  }
  const fresh = await WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const liters = fresh.reduce((sum, log) => sum + Number(log.liters || 0), 0);
  res.json({ liters: Number(liters.toFixed(3)), logs: fresh });
}
