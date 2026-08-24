import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sets: { type: Number, min: 1, max: 20, default: 3 },
  reps: { type: Number, min: 1, max: 200, default: 10 },
  weightLb: { type: Number, min: 0, max: 2000, default: 0 }
}, { _id: false });

const gymLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'Entrenamiento', trim: true },
  workoutType: { type: String, enum: ['upper','lower','push','pull','legs','full_body','cardio','other'], default: 'other' },
  durationMinutes: { type: Number, min: 0, max: 600, default: 0 },
  perceivedEffort: { type: Number, min: 1, max: 10 },
  exercises: { type: [exerciseSchema], default: [] },
  notes: { type: String, trim: true, maxlength: 1000 },
  completedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

gymLogSchema.virtual('volumeLb').get(function(){
  return (this.exercises || []).reduce((sum, e) => sum + Number(e.sets||0)*Number(e.reps||0)*Number(e.weightLb||0), 0);
});
gymLogSchema.set('toJSON',{virtuals:true});
gymLogSchema.set('toObject',{virtuals:true});
gymLogSchema.index({ user: 1, completedAt: -1 });
export default mongoose.model('GymLog', gymLogSchema);
