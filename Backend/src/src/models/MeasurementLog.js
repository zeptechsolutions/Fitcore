import mongoose from 'mongoose';

const measurementLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  armCm: { type: Number, min: 0 },
  chestCm: { type: Number, min: 0 },
  waistCm: { type: Number, min: 0 },
  hipsCm: { type: Number, min: 0 },
  thighCm: { type: Number, min: 0 },
  calfCm: { type: Number, min: 0 },
  notes: { type: String, trim: true, maxlength: 500 },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

measurementLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('MeasurementLog', measurementLogSchema);
