import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import waterRoutes from './routes/waterRoutes.js';
import weightRoutes from './routes/weightRoutes.js';
import gymRoutes from './routes/gymRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import sleepRoutes from './routes/sleepRoutes.js';
import { rejectUnsafePayload, securityHeaders, simpleRateLimit } from './utils/security.js';

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
const allowedOrigins = [...new Set([
  'http://localhost:5173',
  'https://fitcore7.vercel.app',
  config.clientUrl
].filter(Boolean))];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rejectUnsafePayload);
app.use('/api', simpleRateLimit({ windowMs: 60_000, max: 180 }));
app.use('/api/ai', simpleRateLimit({ windowMs: 60_000, max: 25 }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Zhealth API', version: '1.2.0' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/ai', aiRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid resource id' });
  if (err?.code === 11000) return res.status(409).json({ message: 'Duplicate value', fields: err.keyValue });
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return res.status(504).json({ message: 'External service timeout' });
  if (err?.statusCode) return res.status(err.statusCode).json({ message: err.message, code: err.code });
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
