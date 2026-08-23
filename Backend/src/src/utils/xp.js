import User from '../models/User.js';
import { levelFromXp } from './gamification.js';

export async function awardXp(userId, amount) {
  if (!amount || amount <= 0) return;
  const user = await User.findByIdAndUpdate(userId, { $inc: { xp: amount } }, { new: true });
  if (!user) return;
  const level = levelFromXp(user.xp);
  if (user.level !== level) {
    user.level = level;
    await user.save();
  }
}
