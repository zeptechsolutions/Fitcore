import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  progress: { type: Number, default: 0, min: 0 },
  completed: { type: Boolean, default: false }
}, { _id: false });

const challengeSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ['hydration','protein','gym','score','consistency'], required: true },
  target: { type: Number, required: true, min: 1 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  participants: { type: [participantSchema], default: [] },
  status: { type: String, enum: ['upcoming','active','completed','cancelled'], default: 'upcoming' }
}, { timestamps: true });

challengeSchema.index({ 'participants.user': 1, startDate: 1, endDate: 1 });
export default mongoose.model('Challenge', challengeSchema);
