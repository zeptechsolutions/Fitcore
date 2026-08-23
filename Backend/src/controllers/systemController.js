import User from '../models/User.js';
import { config } from '../config.js';
import { emailEnabled, sendInactivityEmail, sendReminderDigestEmail } from '../utils/email.js';
import { buildDueReminders } from '../utils/reminders.js';

function authorized(req) {
  const supplied = req.headers['x-cron-secret'] || req.query.secret;
  return Boolean(config.cronSecret && supplied === config.cronSecret);
}

export async function runScheduledEmails(req, res) {
  if (!authorized(req)) return res.status(401).json({ message: 'Invalid cron secret' });
  if (!emailEnabled()) return res.status(503).json({ message: 'Email service is not configured' });

  const now = new Date(); const cutoff = new Date(now.getTime() - 10 * 86400000);
  const users = await User.find({}).exec();
  const report = { checked: users.length, inactivitySent: 0, remindersSent: 0, skipped: 0, failed: 0 };

  for (const user of users) {
    try {
      const emailPrefs = user.notificationPreferences?.email || {};
      const lastEngagement = [user.lastLoginAt, user.lastRecordAt, user.createdAt].filter(Boolean).map(d=>new Date(d)).sort((a,b)=>b-a)[0];
      if (emailPrefs.inactivity !== false && lastEngagement && lastEngagement <= cutoff && (!user.lastInactivityEmailAt || new Date(user.lastInactivityEmailAt) <= lastEngagement)) {
        const days = Math.floor((now.getTime() - lastEngagement.getTime()) / 86400000);
        await sendInactivityEmail(user, days); user.lastInactivityEmailAt = now; report.inactivitySent++;
      }

      const alreadySentToday = user.lastReminderEmailAt && new Date(user.lastReminderEmailAt).toDateString() === now.toDateString();
      if (!alreadySentToday) {
        const reminders = await buildDueReminders(user, now);
        const allowed = reminders.filter(r => emailPrefs[`${r.type}Reminder`] === true);
        if (allowed.length) { await sendReminderDigestEmail(user, allowed); user.lastReminderEmailAt = now; report.remindersSent++; }
      }
      await user.save();
    } catch (err) { console.error('Scheduled email failed:', user._id, err.message); report.failed++; }
  }
  res.json({ ok: true, ...report });
}

export const runInactivityEmails = runScheduledEmails;
