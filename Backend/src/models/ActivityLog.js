import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  distanceMeters: { type: Number, min: 0, max: 300000 },
  // Legacy fields are kept so existing accounts/data continue to work.
  steps: { type: Number, min: 0, max: 200000 },
  distanceKm: { type: Number, min: 0, max: 300 },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

activityLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('ActivityLog', activityLogSchema);
