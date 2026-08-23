import mongoose from 'mongoose';

const waterLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bottleFraction: { type: Number, enum: [0.25, 0.5, 0.75, 1], required: true },
  bottleSizeLiters: { type: Number, required: true, min: 0.05 },
  liters: { type: Number, required: true, min: 0 },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

waterLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('WaterLog', waterLogSchema);
