import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import { awardXp } from '../utils/xp.js';

async function isFriend(a, b) {
  return Boolean(await Friendship.findOne({
    status: 'accepted',
    $or: [{ requester: a, recipient: b }, { requester: b, recipient: a }]
  }));
}

export async function createChallenge(req, res) {
  const { name, type, target, startDate, endDate, usernames = [] } = req.body;
  if (!name || !type || !target || !startDate || !endDate) return res.status(400).json({ message: 'name, type, target, startDate and endDate are required' });
  if (new Date(endDate) <= new Date(startDate)) return res.status(400).json({ message: 'endDate must be after startDate' });

  const participants = [{ user: req.user.id }];
  for (const username of [...new Set(usernames.map((x) => String(x).toLowerCase()))]) {
    const user = await User.findOne({ username });
    if (user && user._id.toString() !== req.user.id && await isFriend(req.user.id, user._id)) participants.push({ user: user._id });
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const status = now < start ? 'upcoming' : now > end ? 'completed' : 'active';
  const challenge = await Challenge.create({ creator: req.user.id, name, type, target, startDate, endDate, participants, status });
  res.status(201).json(await challenge.populate('participants.user', 'name username level'));
}

export async function getChallenges(req, res) {
  const rows = await Challenge.find({ 'participants.user': req.user.id })
    .populate('creator', 'name username')
    .populate('participants.user', 'name username level')
    .sort({ startDate: -1 });
  res.json(rows);
}

export async function updateChallengeProgress(req, res) {
  const progress = Number(req.body.progress);
  if (!Number.isFinite(progress) || progress < 0) return res.status(400).json({ message: 'Valid progress is required' });
  const challenge = await Challenge.findOne({ _id: req.params.id, 'participants.user': req.user.id });
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  const participant = challenge.participants.find((p) => p.user.toString() === req.user.id);
  participant.progress = progress;
  const wasCompleted = participant.completed;
  participant.completed = progress >= challenge.target;
  await challenge.save();
  if (!wasCompleted && participant.completed) await awardXp(req.user.id, 50);
  res.json(await challenge.populate('participants.user', 'name username level'));
}

export async function cancelChallenge(req, res) {
  const challenge = await Challenge.findOneAndUpdate({ _id: req.params.id, creator: req.user.id }, { status: 'cancelled' }, { new: true });
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  res.json(challenge);
}
