import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  icon: { type: String, default: '🏅' },
  xpReward: { type: Number, default: 0, min: 0 },
  secret: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
