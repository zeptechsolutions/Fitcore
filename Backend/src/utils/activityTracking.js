import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config.js';

const TRACKED_PREFIXES = ['/api/meals','/api/water','/api/weights','/api/gym','/api/activity','/api/sleep','/api/measurements'];

export function trackHealthRecording(req, res, next) {
  if (!['POST','PATCH','DELETE'].includes(req.method) || !TRACKED_PREFIXES.some(prefix => req.path.startsWith(prefix))) return next();
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return next();
  let userId;
  try { userId = jwt.verify(token, config.jwtSecret)?.sub; } catch { return next(); }
  if (!userId) return next();
  res.on('finish', () => {
    if (res.statusCode < 400) User.findByIdAndUpdate(userId, { lastRecordAt: new Date(), lastInactivityEmailAt: null }).catch(() => {});
  });
  next();
}
