import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  feature: {
    type: String,
    enum: ['meal_analysis', 'weekly_summary', 'patterns', 'ask'],
    required: true,
    index: true
  },
  model: { type: String, required: true },
  inputTokens: { type: Number, default: 0, min: 0 },
  outputTokens: { type: Number, default: 0, min: 0 },
  totalTokens: { type: Number, default: 0, min: 0 },
  success: { type: Boolean, default: true, index: true },
  errorCode: { type: String, trim: true },
  latencyMs: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

aiUsageSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('AIUsage', aiUsageSchema);
