import User from '../models/User.js';
import { buildDueReminders } from '../utils/reminders.js';

export async function getReminderPreferences(req, res) {
  const user = await User.findById(req.user.id).select('notificationPreferences');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user.notificationPreferences);
}

export async function updateReminderPreferences(req, res) {
  const allowed = ['enabled','mealReminder','waterReminder','proteinReminder','gymReminder','streakReminder','quietHours','email'];
  const prefs = {}; for (const key of allowed) if (req.body[key] !== undefined) prefs[key] = req.body[key];
  const user = await User.findById(req.user.id); if (!user) return res.status(404).json({ message: 'User not found' });
  user.notificationPreferences = { ...user.notificationPreferences.toObject(), ...prefs };
  await user.save(); res.json(user.notificationPreferences);
}

export async function getDueReminders(req, res) {
  const user = await User.findById(req.user.id); if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(await buildDueReminders(user));
}
