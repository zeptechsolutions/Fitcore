import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, default: 1, min: 0 },
  unit: { type: String, default: 'serving' },
  calories: { type: Number, default: 0, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fats: { type: Number, default: 0, min: 0 }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  servings: { type: Number, default: 1, min: 1 },
  ingredients: { type: [ingredientSchema], default: [] },
  totals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 }
  },
  favorite: { type: Boolean, default: false },
  aiEstimated: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Recipe', recipeSchema);
