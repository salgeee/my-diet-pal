import mongoose, { Document, Model } from 'mongoose';

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

// ==========================================
// 1. User
// ==========================================
export interface IUser {
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
});

export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

// ==========================================
// 2. Profile
// ==========================================
export interface IProfile {
  user_id: string;
  name?: string;
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  activity_level: string;
  calorie_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fat_goal?: number;
  created_at: Date;
  updated_at: Date;
}

const ProfileSchema = new mongoose.Schema<IProfile>({
  user_id: { type: String, required: true, unique: true },
  name: String,
  weight: { type: Number, default: 70 },
  height: { type: Number, default: 170 },
  age: { type: Number, default: 25 },
  sex: { type: String, enum: ['male', 'female'], default: 'male' },
  activity_level: { type: String, default: 'moderate' },
  calorie_goal: Number,
  protein_goal: { type: Number, default: 0 },
  carbs_goal: { type: Number, default: 0 },
  fat_goal: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Profile = (mongoose.models.Profile as Model<IProfile>) || mongoose.model<IProfile>('Profile', ProfileSchema);

// ==========================================
// 3. DailyLog
// ==========================================
export interface IDailyLog {
  user_id: string;
  log_date: string;
  weight?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const DailyLogSchema = new mongoose.Schema<IDailyLog>({
  user_id: { type: String, required: true },
  log_date: { type: String, required: true },
  weight: Number,
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

DailyLogSchema.index({ user_id: 1, log_date: 1 }, { unique: true });

export const DailyLog = (mongoose.models.DailyLog as Model<IDailyLog>) || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

// ==========================================
// 4. FoodEntry
// ==========================================
export interface IFoodEntry {
  user_id: string;
  daily_log_id: string;
  meal_plan_id?: string;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: Date;
}

const FoodEntrySchema = new mongoose.Schema<IFoodEntry>({
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

export const FoodEntry = (mongoose.models.FoodEntry as Model<IFoodEntry>) || mongoose.model<IFoodEntry>('FoodEntry', FoodEntrySchema);

// ==========================================
// 5. MealPlan
// ==========================================
export interface IMealPlan {
  user_id: string;
  name: string;
  target_calories: number;
  meal_order: number;
  is_default: boolean;
  created_at: Date;
}

const MealPlanSchema = new mongoose.Schema<IMealPlan>({
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  target_calories: { type: Number, default: 0 },
  meal_order: { type: Number, default: 0 },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export const MealPlan = (mongoose.models.MealPlan as Model<IMealPlan>) || mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);

// ==========================================
// 6. PlannedFood (A que estava dando erro)
// ==========================================
export interface IPlannedFood {
  user_id: string;
  meal_plan_id: string;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: Date;
}

const PlannedFoodSchema = new mongoose.Schema<IPlannedFood>({
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

export const PlannedFood = (mongoose.models.PlannedFood as Model<IPlannedFood>) || mongoose.model<IPlannedFood>('PlannedFood', PlannedFoodSchema);

// ==========================================
// 7. CustomFood
// ==========================================
export interface ICustomFood {
  user_id: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  brand?: string;
  created_at: Date;
}

const CustomFoodSchema = new mongoose.Schema<ICustomFood>({
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

export const CustomFood = (mongoose.models.CustomFood as Model<ICustomFood>) || mongoose.model<ICustomFood>('CustomFood', CustomFoodSchema);

// ==========================================
// 8. FavoriteFood
// ==========================================
export interface IFavoriteFood {
  user_id: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  created_at: Date;
}

const FavoriteFoodSchema = new mongoose.Schema<IFavoriteFood>({
  user_id: { type: String, required: true },
  food_name: { type: String, required: true },
  calories_per_100g: { type: Number, required: true },
  protein_per_100g: Number,
  carbs_per_100g: Number,
  fat_per_100g: Number,
  created_at: { type: Date, default: Date.now },
});

export const FavoriteFood = (mongoose.models.FavoriteFood as Model<IFavoriteFood>) || mongoose.model<IFavoriteFood>('FavoriteFood', FavoriteFoodSchema);

// Globais
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}