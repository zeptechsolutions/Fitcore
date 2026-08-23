import mongoose from 'mongoose';

const favoriteItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, default: 1, min: 0 },
  unit: { type: String, default: 'serving', trim: true },
  calories: { type: Number, default: 0, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fats: { type: Number, default: 0, min: 0 }
}, { _id: false });

const favoriteMealSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  defaultType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
  items: { type: [favoriteItemSchema], default: [] },
  totals: {
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fats: { type: Number, default: 0, min: 0 }
  },
  useCount: { type: Number, default: 0, min: 0 },
  lastUsedAt: Date
}, { timestamps: true });

favoriteMealSchema.index({ user: 1, name: 1 }, { unique: true });
export default mongoose.model('FavoriteMeal', favoriteMealSchema);
