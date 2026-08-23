import mongoose from 'mongoose';

const macroGoalsSchema = new mongoose.Schema({
  calories: { type: Number, default: 2000, min: 0 },
  protein: { type: Number, default: 120, min: 0 },
  carbs: { type: Number, default: 250, min: 0 },
  fats: { type: Number, default: 70, min: 0 }
}, { _id: false });

const privacySchema = new mongoose.Schema({
  weight: { type: String, enum: ['private', 'friends'], default: 'private' },
  measurements: { type: String, enum: ['private', 'friends'], default: 'private' },
  macros: { type: String, enum: ['private', 'friends'], default: 'private' },
  meals: { type: String, enum: ['private', 'friends'], default: 'private' },
  score: { type: String, enum: ['private', 'friends'], default: 'friends' },
  gym: { type: String, enum: ['private', 'friends'], default: 'friends' },
  streaks: { type: String, enum: ['private', 'friends'], default: 'friends' },
  activity: { type: String, enum: ['private', 'friends'], default: 'friends' },
  sleep: { type: String, enum: ['private', 'friends'], default: 'private' }
}, { _id: false });


const notificationPreferencesSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  mealReminder: { type: Boolean, default: true },
  waterReminder: { type: Boolean, default: true },
  proteinReminder: { type: Boolean, default: true },
  gymReminder: { type: Boolean, default: true },
  streakReminder: { type: Boolean, default: true },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '07:00' }
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  birthDate: Date,
  heightCm: { type: Number, min: 50, max: 260 },
  startingWeightKg: { type: Number, min: 20, max: 500 },
  targetWeightKg: { type: Number, min: 20, max: 500 },
  currentWeightKg: { type: Number, min: 20, max: 500 },
  avatarId: { type: Number, min: 1, max: 5, default: 1 },
  goal: {
    type: String,
    enum: ['gain', 'lose', 'maintain', 'recomp', 'tracking'],
    default: 'tracking'
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  macroGoals: { type: macroGoalsSchema, default: () => ({}) },
  waterGoalLiters: { type: Number, default: 2.5, min: 0 },
  bottleSizeLiters: { type: Number, default: 1, min: 0.05 },
  weeklyGymGoal: { type: Number, default: 3, min: 0, max: 14 },
  dailyStepGoal: { type: Number, default: 10000, min: 0, max: 100000 },
  sleepGoalHours: { type: Number, default: 8, min: 0, max: 24 },
  strideLengthCm: { type: Number, min: 20, max: 200 },
  xp: { type: Number, default: 0, min: 0 },
  level: { type: Number, default: 1, min: 1 },
  privacy: { type: privacySchema, default: () => ({}) },
  notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
