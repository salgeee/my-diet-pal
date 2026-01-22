// MongoDB connection e models (CommonJS version para desenvolvimento)
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || '';

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não está definida');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ Conectado ao MongoDB');
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

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

const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

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

const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);

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

const FoodEntry = mongoose.models.FoodEntry || mongoose.model('FoodEntry', FoodEntrySchema);

// MealPlan Schema
const MealPlanSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  target_calories: { type: Number, default: 0 },
  meal_order: { type: Number, default: 0 },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

const MealPlan = mongoose.models.MealPlan || mongoose.model('MealPlan', MealPlanSchema);

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

const PlannedFood = mongoose.models.PlannedFood || mongoose.model('PlannedFood', PlannedFoodSchema);

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

const CustomFood = mongoose.models.CustomFood || mongoose.model('CustomFood', CustomFoodSchema);

module.exports = {
  connectDB,
  User,
  Profile,
  DailyLog,
  FoodEntry,
  MealPlan,
  PlannedFood,
  CustomFood,
};
