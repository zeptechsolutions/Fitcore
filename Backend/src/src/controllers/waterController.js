import User from '../models/User.js';
import WaterLog from '../models/WaterLog.js';
import { dayRange } from '../utils/date.js';
import { awardXp } from '../utils/xp.js';

export async function addWater(req, res) {
  const fraction = Number(req.body.bottleFraction);
  if (![0.25, 0.5, 1].includes(fraction)) return res.status(400).json({ message: 'bottleFraction must be 0.25, 0.5 or 1' });
  const user = await User.findById(req.user.id);
  const bottleSizeLiters = Number(req.body.bottleSizeLiters || user.bottleSizeLiters);
  const log = await WaterLog.create({ user: req.user.id, bottleFraction: fraction, bottleSizeLiters, liters: fraction * bottleSizeLiters, loggedAt: req.body.loggedAt });
  await awardXp(req.user.id, 2);
  res.status(201).json(log);
}

export async function getWater(req, res) {
  const { start, end } = dayRange(req.query.date || new Date());
  const logs = await WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const liters = logs.reduce((sum, log) => sum + log.liters, 0);
  res.json({ liters: Number(liters.toFixed(3)), logs });
}

export async function deleteWater(req, res) {
  const log = await WaterLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!log) return res.status(404).json({ message: 'Water log not found' });
  res.status(204).end();
}

export async function subtractWater(req, res) {
  const fraction = Number(req.body.bottleFraction);
  if (![0.25, 0.5, 1].includes(fraction)) return res.status(400).json({ message: 'bottleFraction must be 0.25, 0.5 or 1' });
  const user = await User.findById(req.user.id);
  const targetLiters = fraction * Number(user.bottleSizeLiters || 1);
  const { start, end } = dayRange(req.body.date || new Date());
  const logs = await WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: -1 });

  let remaining = targetLiters;
  for (const log of logs) {
    if (remaining <= 0.0001) break;
    if (log.liters <= remaining + 0.0001) {
      remaining -= log.liters;
      await WaterLog.deleteOne({ _id: log._id, user: req.user.id });
    } else {
      const newLiters = Number((log.liters - remaining).toFixed(3));
      const newFraction = Number((newLiters / log.bottleSizeLiters).toFixed(2));
      if (![0.25, 0.5, 0.75, 1].includes(newFraction)) {
        await WaterLog.deleteOne({ _id: log._id, user: req.user.id });
      } else {
        log.liters = newLiters;
        log.bottleFraction = newFraction;
        await log.save();
      }
      remaining = 0;
    }
  }

  const fresh = await WaterLog.find({ user: req.user.id, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 });
  const liters = fresh.reduce((sum, log) => sum + log.liters, 0);
  res.json({ liters: Number(liters.toFixed(3)), logs: fresh });
}
