import mongoose from 'mongoose';

const macroSchema = new mongoose.Schema({
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 }
}, { _id: false });

const dailySnapshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  day: { type: Date, required: true, index: true },
  score: { type: Number, min: 0, max: 100, required: true },
  nutrition: { type: macroSchema, default: () => ({}) },
  waterLiters: { type: Number, default: 0 },
  steps: { type: Number, default: 0 },
  distanceKm: { type: Number, default: 0 },
  sleepHours: { type: Number, default: 0 },
  gymDone: { type: Boolean, default: false },
  mealCount: { type: Number, default: 0 },
  proteinGoalMet: { type: Boolean, default: false },
  waterGoalMet: { type: Boolean, default: false },
  stepGoalMet: { type: Boolean, default: false },
  sleepGoalMet: { type: Boolean, default: false }
}, { timestamps: true });

dailySnapshotSchema.index({ user: 1, day: 1 }, { unique: true });
export default mongoose.model('DailySnapshot', dailySnapshotSchema);
