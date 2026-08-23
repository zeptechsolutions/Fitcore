import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, default: 1, min: 0 },
  unit: { type: String, default: 'serving' },
  calories: { type: Number, default: 0, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fats: { type: Number, default: 0, min: 0 }
}, { _id: false });

const mealSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  source: { type: String, enum: ['manual', 'ai', 'barcode', 'recipe'], default: 'manual' },
  items: { type: [foodItemSchema], default: [] },
  totals: {
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fats: { type: Number, default: 0, min: 0 }
  },
  loggedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

mealSchema.index({ user: 1, loggedAt: -1 });
export default mongoose.model('Meal', mealSchema);
