import mongoose from 'mongoose';

const sleepLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sleptAt: { type: Date },
  wokeAt: { type: Date },
  hours: { type: Number, required: true, min: 0, max: 24 },
  notes: { type: String, trim: true, maxlength: 500 },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

sleepLogSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('SleepLog', sleepLogSchema);
