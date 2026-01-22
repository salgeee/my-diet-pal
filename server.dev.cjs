// Servidor de desenvolvimento para APIs
// Rode com: node server.dev.cjs

// IMPORTANTE: Carregar variáveis de ambiente PRIMEIRO
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const express = require('express');
const cors = require('cors');
const { connectDB, User, Profile, DailyLog, FoodEntry, MealPlan, PlannedFood, CustomFood } = require('./lib/mongodb.cjs');

const app = express();
app.use(cors());
app.use(express.json());

// Helper para extrair userId do token
function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    return Buffer.from(token, 'base64').toString();
  } catch {
    return null;
  }
}

// AUTH
app.post('/api/auth', async (req, res) => {
  try {
    await connectDB();
    const { action, email, password, name } = req.body;

    if (action === 'signup') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const user = await User.create({ email, password, name, createdAt: new Date() });
      const token = Buffer.from(user._id.toString()).toString('base64');
      return res.json({ 
        data: { 
          user: { id: user._id.toString(), email: user.email, name: user.name },
          token 
        } 
      });
    }

    if (action === 'signin') {
      const user = await User.findOne({ email, password });
      if (!user) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const token = Buffer.from(user._id.toString()).toString('base64');
      return res.json({ 
        data: { 
          user: { id: user._id.toString(), email: user.email, name: user.name },
          token 
        } 
      });
    }

    return res.status(400).json({ error: 'Ação inválida' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ 
      data: { 
        user: { id: user._id.toString(), email: user.email, name: user.name }
      } 
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PROFILE
app.get('/api/profile', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const profile = await Profile.findOne({ user_id: userId });
    return res.json({ data: profile });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const profile = await Profile.findOneAndUpdate(
      { user_id: userId },
      { ...req.body, user_id: userId, updated_at: new Date() },
      { new: true, upsert: true }
    );
    return res.json({ data: profile });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DAILY LOG
app.get('/api/daily-log', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { date, action, days } = req.query;
    const dateStr = date || new Date().toISOString().split('T')[0];

    // Buscar histórico dos últimos X dias
    if (action === 'history') {
      const numDays = parseInt(days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);
      
      const dailyLogs = await DailyLog.find({ 
        user_id: userId,
        log_date: { $gte: startDate.toISOString().split('T')[0] }
      }).sort({ log_date: -1 });

      const history = await Promise.all(dailyLogs.map(async (log) => {
        const entries = await FoodEntry.find({ daily_log_id: log._id.toString() });
        const totalCalories = entries.reduce((sum, e) => sum + Number(e.calories), 0);
        
        return {
          date: log.log_date,
          totalCalories,
          entries: entries.map(e => ({ ...e.toObject(), id: e._id.toString() })),
        };
      }));

      return res.json({ data: history });
    }

    // Buscar log de um dia específico
    const dailyLog = await DailyLog.findOne({ user_id: userId, log_date: dateStr });
    const foodEntries = dailyLog 
      ? await FoodEntry.find({ daily_log_id: dailyLog._id.toString() }).sort({ created_at: 1 })
      : [];

    return res.json({ 
      data: { 
        dailyLog: dailyLog ? { ...dailyLog.toObject(), id: dailyLog._id.toString() } : null,
        foodEntries: foodEntries.map(e => ({ ...e.toObject(), id: e._id.toString() }))
      } 
    });
  } catch (error) {
    console.error('Daily log error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/daily-log', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { action, date, food_name, quantity_grams, calories, protein, carbs, fat, meal_plan_id } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    if (action === 'create') {
      let dailyLog = await DailyLog.findOne({ user_id: userId, log_date: dateStr });
      if (!dailyLog) {
        dailyLog = await DailyLog.create({ user_id: userId, log_date: dateStr });
      }
      return res.json({ data: { ...dailyLog.toObject(), id: dailyLog._id.toString() } });
    }

    if (action === 'addFood') {
      let dailyLog = await DailyLog.findOne({ user_id: userId, log_date: dateStr });
      if (!dailyLog) {
        dailyLog = await DailyLog.create({ user_id: userId, log_date: dateStr });
      }

      const foodEntry = await FoodEntry.create({
        user_id: userId,
        daily_log_id: dailyLog._id.toString(),
        food_name,
        quantity_grams,
        calories,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        meal_plan_id: meal_plan_id || null,
      });

      return res.json({ data: { ...foodEntry.toObject(), id: foodEntry._id.toString() } });
    }

    return res.status(400).json({ error: 'Ação inválida' });
  } catch (error) {
    console.error('Daily log error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/daily-log', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { foodEntryId } = req.query;
    
    if (!foodEntryId) {
      return res.status(400).json({ error: 'ID do alimento é obrigatório' });
    }

    // Verificar se o alimento pertence ao usuário
    const foodEntry = await FoodEntry.findById(foodEntryId);
    if (!foodEntry) {
      return res.status(404).json({ error: 'Alimento não encontrado' });
    }

    if (foodEntry.user_id !== userId) {
      return res.status(403).json({ error: 'Sem permissão para remover este alimento' });
    }

    await FoodEntry.findByIdAndDelete(foodEntryId);
    return res.json({ data: { success: true } });
  } catch (error) {
    console.error('Daily log error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// MEAL PLANS
app.get('/api/meal-plans', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const mealPlans = await MealPlan.find({ user_id: userId }).sort({ meal_order: 1 });
    return res.json({ 
      data: mealPlans.map(m => ({ ...m.toObject(), id: m._id.toString() }))
    });
  } catch (error) {
    console.error('Meal plans error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/meal-plans', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { action, name, target_calories } = req.body;

    if (action === 'createDefaults') {
      const DEFAULT_MEALS = [
        { name: 'Café da manhã', target_calories: 400, meal_order: 1 },
        { name: 'Almoço', target_calories: 600, meal_order: 2 },
        { name: 'Lanche', target_calories: 200, meal_order: 3 },
        { name: 'Jantar', target_calories: 500, meal_order: 4 },
      ];

      const meals = await MealPlan.insertMany(
        DEFAULT_MEALS.map(meal => ({ ...meal, user_id: userId, is_default: true }))
      );

      return res.json({ 
        data: meals.map(m => ({ ...m.toObject(), id: m._id.toString() }))
      });
    }

    if (action === 'create') {
      const maxOrder = await MealPlan.findOne({ user_id: userId })
        .sort({ meal_order: -1 })
        .then(m => m?.meal_order || 0);

      const mealPlan = await MealPlan.create({
        user_id: userId,
        name,
        target_calories,
        meal_order: maxOrder + 1,
        is_default: false,
      });

      return res.json({ data: { ...mealPlan.toObject(), id: mealPlan._id.toString() } });
    }

    return res.status(400).json({ error: 'Ação inválida' });
  } catch (error) {
    console.error('Meal plans error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/meal-plans', async (req, res) => {
  try {
    await connectDB();
    const { id, ...updates } = req.body;
    const mealPlan = await MealPlan.findByIdAndUpdate(id, updates, { new: true });
    return res.json({ data: { ...mealPlan?.toObject(), id: mealPlan?._id.toString() } });
  } catch (error) {
    console.error('Meal plans error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/meal-plans', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.query;
    await MealPlan.findByIdAndDelete(id);
    // Também deletar alimentos planejados dessa refeição
    await PlannedFood.deleteMany({ meal_plan_id: id });
    return res.json({ data: { success: true } });
  } catch (error) {
    console.error('Meal plans error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PLANNED FOODS - Alimentos do plano do nutricionista
app.get('/api/planned-foods', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { meal_plan_id } = req.query;
    const query = { user_id: userId };
    if (meal_plan_id) query.meal_plan_id = meal_plan_id;

    const plannedFoods = await PlannedFood.find(query).sort({ created_at: 1 });
    return res.json({ 
      data: plannedFoods.map(f => ({ ...f.toObject(), id: f._id.toString() }))
    });
  } catch (error) {
    console.error('Planned foods error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/planned-foods', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { meal_plan_id, food_name, quantity_grams, calories, protein, carbs, fat } = req.body;

    const plannedFood = await PlannedFood.create({
      user_id: userId,
      meal_plan_id,
      food_name,
      quantity_grams,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
    });

    // Atualizar target_calories da refeição
    const allPlannedFoods = await PlannedFood.find({ meal_plan_id });
    const totalCalories = allPlannedFoods.reduce((sum, f) => sum + f.calories, 0);
    await MealPlan.findByIdAndUpdate(meal_plan_id, { target_calories: totalCalories });

    return res.json({ data: { ...plannedFood.toObject(), id: plannedFood._id.toString() } });
  } catch (error) {
    console.error('Planned foods error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/planned-foods', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { id } = req.query;
    const plannedFood = await PlannedFood.findOne({ _id: id, user_id: userId });
    if (!plannedFood) return res.status(404).json({ error: 'Não encontrado' });

    const meal_plan_id = plannedFood.meal_plan_id;
    await PlannedFood.findByIdAndDelete(id);

    // Atualizar target_calories da refeição
    const allPlannedFoods = await PlannedFood.find({ meal_plan_id });
    const totalCalories = allPlannedFoods.reduce((sum, f) => sum + f.calories, 0);
    await MealPlan.findByIdAndUpdate(meal_plan_id, { target_calories: totalCalories });

    return res.json({ data: { success: true } });
  } catch (error) {
    console.error('Planned foods error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// CUSTOM FOODS - Alimentos personalizados
app.get('/api/custom-foods', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { search } = req.query;
    const query = { user_id: userId };
    if (search) query.food_name = { $regex: search, $options: 'i' };

    const customFoods = await CustomFood.find(query).sort({ food_name: 1 }).limit(50);
    return res.json({ 
      data: customFoods.map(f => ({ ...f.toObject(), id: f._id.toString() }))
    });
  } catch (error) {
    console.error('Custom foods error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/custom-foods', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, brand } = req.body;

    // Verificar se já existe
    const existing = await CustomFood.findOne({ 
      user_id: userId, 
      food_name: { $regex: `^${food_name}$`, $options: 'i' } 
    });

    if (existing) {
      existing.calories_per_100g = calories_per_100g;
      existing.protein_per_100g = protein_per_100g || 0;
      existing.carbs_per_100g = carbs_per_100g || 0;
      existing.fat_per_100g = fat_per_100g || 0;
      if (brand) existing.brand = brand;
      await existing.save();
      return res.json({ data: { ...existing.toObject(), id: existing._id.toString() } });
    }

    const customFood = await CustomFood.create({
      user_id: userId,
      food_name,
      calories_per_100g,
      protein_per_100g: protein_per_100g || 0,
      carbs_per_100g: carbs_per_100g || 0,
      fat_per_100g: fat_per_100g || 0,
      brand,
    });

    return res.json({ data: { ...customFood.toObject(), id: customFood._id.toString() } });
  } catch (error) {
    console.error('Custom foods error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/custom-foods', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    const { id } = req.query;
    await CustomFood.findOneAndDelete({ _id: id, user_id: userId });
    return res.json({ data: { success: true } });
  } catch (error) {
    console.error('Custom foods error:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log(`📝 Frontend: rode "npm run dev" em outro terminal`);
});
