import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  steps: { type: Number, required: true, min: 0, max: 200000 },
  distanceKm: { type: Number, required: true, min: 0, max: 300 },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

activityLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('ActivityLog', activityLogSchema);
