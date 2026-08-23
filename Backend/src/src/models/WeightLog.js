import mongoose from 'mongoose';

const weightLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weightKg: { type: Number, required: true, min: 20, max: 500 },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

weightLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('WeightLog', weightLogSchema);
