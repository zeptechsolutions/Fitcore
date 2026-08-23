import mongoose from 'mongoose';

const gymLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'Workout', trim: true },
  notes: { type: String, trim: true },
  completedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

gymLogSchema.index({ user: 1, completedAt: -1 });
export default mongoose.model('GymLog', gymLogSchema);
