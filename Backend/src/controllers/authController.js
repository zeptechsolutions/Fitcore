import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config.js';
import { withUserWeightLb } from '../utils/weight.js';

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: '7d' });
}

function safeUser(user) {
  const value = withUserWeightLb(user);
  delete value.passwordHash;
  return value;
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
  const user = await User.create({ name, username, email, passwordHash });
  return res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid credentials' });
  return res.json({ token: tokenFor(user), user: safeUser(user) });
}
