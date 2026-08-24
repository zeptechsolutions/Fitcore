import mongoose from 'mongoose';

const waterLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  liters: { type: Number, required: true, min: 0 },
  // Legacy bottle fields remain optional for old records.
  bottleFraction: Number,
  bottleSizeLiters: Number,
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

waterLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('WaterLog', waterLogSchema);
