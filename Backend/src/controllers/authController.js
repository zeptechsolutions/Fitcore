import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { config } from '../config.js';
import { withUserWeightLb, lbToKg } from '../utils/weight.js';
import { buildPersonalPlan } from '../utils/plan.js';
import { emailEnabled, sendResetCodeEmail, sendWelcomeEmail } from '../utils/email.js';

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: '7d' });
}

function safeUser(user) {
  const value = withUserWeightLb(user);
  delete value.passwordHash;
  delete value.passwordResetCodeHash;
  delete value.passwordResetExpiresAt;
  delete value.passwordResetAttempts;
  return value;
}

function hashResetCode(code) {
  return crypto.createHmac('sha256', config.jwtSecret).update(String(code)).digest('hex');
}

export async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const username = String(req.body.username || '').trim().toLowerCase();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !username || !email || !password) return res.status(400).json({ message: 'name, username, email and password are required' });
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) return res.status(400).json({ message: 'username must be 3-30 characters using letters, numbers, _ or .' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Invalid email' });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'password must be 8-128 characters' });

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) return res.status(409).json({ message: 'Email or username already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const userData = {
    name, username, email, passwordHash,
    birthDate: req.body.birthDate || undefined,
    biologicalSex: req.body.biologicalSex || 'unspecified',
    heightCm: Number(req.body.heightCm) || undefined,
    currentWeightKg: req.body.currentWeightLb ? lbToKg(req.body.currentWeightLb) : undefined,
    startingWeightKg: req.body.currentWeightLb ? lbToKg(req.body.currentWeightLb) : undefined,
    targetWeightKg: req.body.targetWeightLb ? lbToKg(req.body.targetWeightLb) : undefined,
    goal: req.body.goal || 'tracking',
    activityLevel: req.body.activityLevel || 'moderate',
    weeklyGymGoal: Number(req.body.weeklyGymGoal) || 3,
    lastLoginAt: new Date(),
    lastRecordAt: new Date()
  };

  try {
    const plan = buildPersonalPlan(userData);
    userData.personalizedPlan = plan;
    userData.macroGoals = { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats };
  } catch { /* Profile can be completed later. */ }

  const user = await User.create(userData);
  if (emailEnabled() && user.notificationPreferences?.email?.welcome !== false) {
    sendWelcomeEmail(user).catch(err => console.error('Welcome email failed:', err.message));
  }
  return res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid credentials' });
  user.lastLoginAt = new Date();
  user.lastInactivityEmailAt = null;
  await user.save();
  return res.json({ token: tokenFor(user), user: safeUser(user) });
}

export async function requestPasswordReset(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required' });
  if (!emailEnabled()) return res.status(503).json({ message: 'Email service is not configured yet' });

  const user = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts');
  // Same response whether the account exists or not.
  if (!user) return res.json({ message: 'If that email belongs to a Zhealth account, a code has been sent.' });

  const code = String(crypto.randomInt(100000, 1000000));
  user.passwordResetCodeHash = hashResetCode(code);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.passwordResetAttempts = 0;
  await user.save();
  await sendResetCodeEmail(user, code);
  res.json({ message: 'If that email belongs to a Zhealth account, a code has been sent.' });
}

export async function verifyPasswordResetCode(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const user = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts');
  if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) return res.status(400).json({ message: 'Invalid or expired code' });
  if (user.passwordResetExpiresAt < new Date()) return res.status(400).json({ message: 'Invalid or expired code' });
  if ((user.passwordResetAttempts || 0) >= 5) return res.status(429).json({ message: 'Too many attempts. Request a new code.' });
  if (hashResetCode(code) !== user.passwordResetCodeHash) {
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    await user.save();
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
  res.json({ valid: true });
}

export async function resetPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const password = String(req.body.password || '');
  if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'password must be 8-128 characters' });

  const user = await User.findOne({ email }).select('+passwordHash +passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts');
  if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date() || hashResetCode(code) !== user.passwordResetCodeHash) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetCodeHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.passwordResetAttempts = 0;
  await user.save();
  res.json({ message: 'Password updated. You can sign in now.' });
}
