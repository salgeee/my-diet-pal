// MongoDB connection e models
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI && typeof window === 'undefined') {
  console.warn('⚠️ MONGODB_URI não definida. Configure a variável de ambiente.');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não está definida. Crie um arquivo .env com MONGODB_URI=mongodb+srv://...');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      cached.promise = null;
      throw new Error(`Erro ao conectar ao MongoDB: ${error.message}`);
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Profile Schema
const ProfileSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: String,
  weight: { type: Number, default: 70 },
  height: { type: Number, default: 170 },
  age: { type: Number, default: 25 },
  sex: { type: String, enum: ['male', 'female'], default: 'male' },
  activity_level: { type: String, default: 'moderate' },
  calorie_goal: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

// DailyLog Schema
const DailyLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  log_date: { type: String, required: true },
  weight: Number,
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

DailyLogSchema.index({ user_id: 1, log_date: 1 }, { unique: true });

export const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);

// FoodEntry Schema
const FoodEntrySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  daily_log_id: { type: String, required: true },
  meal_plan_id: String,
  food_name: { type: String, required: true },
  quantity_grams: { type: Number, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

export const FoodEntry = mongoose.models.FoodEntry || mongoose.model('FoodEntry', FoodEntrySchema);

// MealPlan Schema
const MealPlanSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  target_calories: { type: Number, default: 0 },
  meal_order: { type: Number, default: 0 },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export const MealPlan = mongoose.models.MealPlan || mongoose.model('MealPlan', MealPlanSchema);

// PlannedFood Schema - Alimentos do plano do nutricionista
const PlannedFoodSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  meal_plan_id: { type: String, required: true },
  food_name: { type: String, required: true },
  quantity_grams: { type: Number, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

export const PlannedFood = mongoose.models.PlannedFood || mongoose.model('PlannedFood', PlannedFoodSchema);

// CustomFood Schema - Alimentos personalizados do usuário
const CustomFoodSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  food_name: { type: String, required: true },
  calories_per_100g: { type: Number, required: true },
  protein_per_100g: { type: Number, default: 0 },
  carbs_per_100g: { type: Number, default: 0 },
  fat_per_100g: { type: Number, default: 0 },
  brand: String,
  created_at: { type: Date, default: Date.now },
});

CustomFoodSchema.index({ user_id: 1, food_name: 1 });

export const CustomFood = mongoose.models.CustomFood || mongoose.model('CustomFood', CustomFoodSchema);

// FavoriteFood Schema
const FavoriteFoodSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  food_name: { type: String, required: true },
  calories_per_100g: { type: Number, required: true },
  protein_per_100g: Number,
  carbs_per_100g: Number,
  fat_per_100g: Number,
  created_at: { type: Date, default: Date.now },
});

export const FavoriteFood = mongoose.models.FavoriteFood || mongoose.model('FavoriteFood', FavoriteFoodSchema);

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
