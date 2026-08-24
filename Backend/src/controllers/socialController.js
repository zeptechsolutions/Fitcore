import mongoose from 'mongoose';
import Friendship from '../models/Friendship.js';
import User from '../models/User.js';
import DailySnapshot from '../models/DailySnapshot.js';
import WeightLog from '../models/WeightLog.js';
import MeasurementLog from '../models/MeasurementLog.js';
import GymLog from '../models/GymLog.js';
import Meal from '../models/Meal.js';
import ActivityLog from '../models/ActivityLog.js';
import SleepLog from '../models/SleepLog.js';
import { weekRange } from '../utils/date.js';
import { withWeightLb } from '../utils/weight.js';

function publicUser(user) {
  return { id: user._id, name: user.name, username: user.username, level: user.level, xp: user.xp, avatarId: user.avatarId || 1 };
}

async function acceptedFriendIds(userId) {
  const rows = await Friendship.find({ status: 'accepted', $or: [{ requester: userId }, { recipient: userId }] });
  return rows.map((f) => f.requester.toString() === userId.toString() ? f.recipient : f.requester);
}

async function areFriends(a, b) {
  return Boolean(await Friendship.exists({
    status: 'accepted',
    $or: [{ requester: a, recipient: b }, { requester: b, recipient: a }]
  }));
}

export async function searchUsers(req, res) {
  const q = String(req.query.q || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (q.length < 2) return res.json([]);
  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [{ username: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }]
  }).limit(15);
  res.json(users.map(publicUser));
}

export async function sendFriendRequest(req, res) {
  const recipient = await User.findOne({ username: String(req.body.username || '').toLowerCase() });
  if (!recipient) return res.status(404).json({ message: 'User not found' });
  if (recipient._id.toString() === req.user.id) return res.status(400).json({ message: 'You cannot add yourself' });
  const existing = await Friendship.findOne({ $or: [{ requester: req.user.id, recipient: recipient._id }, { requester: recipient._id, recipient: req.user.id }] });
  if (existing) return res.status(409).json({ message: 'Friendship already exists', friendship: existing });
  const friendship = await Friendship.create({ requester: req.user.id, recipient: recipient._id });
  res.status(201).json(friendship);
}

export async function getFriendRequests(req, res) {
  const requests = await Friendship.find({ recipient: req.user.id, status: 'pending' })
    .populate('requester', 'name username level xp avatarId').sort({ createdAt: -1 });
  res.json(requests);
}

export async function respondFriendRequest(req, res) {
  const status = req.body.status;
  if (!['accepted','rejected'].includes(status)) return res.status(400).json({ message: 'status must be accepted or rejected' });
  const friendship = await Friendship.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id, status: 'pending' }, { status }, { new: true }
  );
  if (!friendship) return res.status(404).json({ message: 'Friend request not found' });
  res.json(friendship);
}

export async function getFriends(req, res) {
  const ids = await acceptedFriendIds(req.user.id);
  const users = await User.find({ _id: { $in: ids } });
  res.json(users.map(publicUser));
}

export async function removeFriend(req, res) {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ message: 'Invalid user id' });
  const removed = await Friendship.findOneAndDelete({
    status: 'accepted',
    $or: [{ requester: req.user.id, recipient: req.params.userId }, { requester: req.params.userId, recipient: req.user.id }]
  });
  if (!removed) return res.status(404).json({ message: 'Friendship not found' });
  res.status(204).end();
}

export async function getFriendOverview(req, res) {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ message: 'Invalid user id' });
  if (!(await areFriends(req.user.id, req.params.userId))) return res.status(403).json({ message: 'This user is not your friend' });
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const privacy = user.privacy || {};
  const data = { user: publicUser(user), visible: {} };

  const week = weekRange(new Date());
  if (privacy.score === 'friends') {
    const snapshots = await DailySnapshot.find({ user: user._id, day: { $gte: week.start, $lte: week.end } }).lean();
    data.visible.score = snapshots.length ? Math.round(snapshots.reduce((s, x) => s + Number(x.score || 0), 0) / snapshots.length) : 0;
  }
  if (privacy.gym === 'friends') data.visible.gymThisWeek = await GymLog.countDocuments({ user: user._id, completedAt: { $gte: week.start, $lte: week.end } });
  if (privacy.weight === 'friends') {
    const latestWeight = await WeightLog.findOne({ user: user._id }).sort({ loggedAt: -1 }).select('weightKg loggedAt -_id').lean();
    data.visible.latestWeight = withWeightLb(latestWeight);
  }
  if (privacy.measurements === 'friends') data.visible.latestMeasurements = await MeasurementLog.findOne({ user: user._id }).sort({ loggedAt: -1 }).select('-_id -user -__v').lean();
  if (privacy.meals === 'friends') data.visible.recentMeals = await Meal.find({ user: user._id }).sort({ loggedAt: -1 }).limit(5).select('type title loggedAt -_id').lean();
  if (privacy.activity === 'friends') {
    const rows = await ActivityLog.find({ user: user._id, loggedAt: { $gte: week.start, $lte: week.end } }).lean();
    data.visible.distanceMetersThisWeek = Math.round(rows.reduce((sum, x) => sum + (Number.isFinite(Number(x.distanceMeters)) ? Number(x.distanceMeters) : Number(x.distanceKm || 0) * 1000), 0));
    data.visible.distanceKmThisWeek = Number((data.visible.distanceMetersThisWeek / 1000).toFixed(2));
  }
  if (privacy.sleep === 'friends') {
    const rows = await SleepLog.find({ user: user._id, loggedAt: { $gte: week.start, $lte: week.end } }).lean();
    data.visible.avgSleepHours = rows.length ? Number((rows.reduce((sum, x) => sum + Number(x.hours || 0), 0) / rows.length).toFixed(1)) : 0;
  }
  if (privacy.macros === 'friends') {
    const latest = await DailySnapshot.findOne({ user: user._id }).sort({ day: -1 }).select('day nutrition -_id').lean();
    data.visible.macros = latest || null;
  }
  res.json(data);
}

export async function getWeeklyRanking(req, res) {
  const friendIds = await acceptedFriendIds(req.user.id);
  const ids = [new mongoose.Types.ObjectId(req.user.id), ...friendIds];
  const { start, end } = weekRange(req.query.date || new Date());
  const [users, snapshots] = await Promise.all([
    User.find({ _id: { $in: ids } }),
    DailySnapshot.find({ user: { $in: ids }, day: { $gte: start, $lte: end } })
  ]);
  const scoreMap = new Map();
  for (const row of snapshots) {
    const key = row.user.toString();
    const item = scoreMap.get(key) || { total: 0, days: 0 };
    item.total += row.score; item.days += 1; scoreMap.set(key, item);
  }
  const ranking = users
    .filter(user => user._id.toString() === req.user.id || user.privacy?.score === 'friends')
    .map((user) => {
      const stats = scoreMap.get(user._id.toString()) || { total: 0, days: 0 };
      return { ...publicUser(user), weeklyScore: stats.days ? Math.round(stats.total / stats.days) : 0, trackedDays: stats.days };
    }).sort((a,b) => b.weeklyScore - a.weeklyScore);
  res.json(ranking.map((row, index) => ({ rank: index + 1, ...row })));
}
