import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, MealPlan } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (error) {
    console.error('DB connection error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao conectar ao banco de dados' 
    });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    if (req.method === 'GET') {
      const mealPlans = await MealPlan.find({ user_id: userId }).sort({ meal_order: 1 });
      return res.json({ 
        data: mealPlans.map(m => ({ ...m.toObject(), id: m._id.toString() }))
      });
    }

    if (req.method === 'POST') {
      const { action, name, target_calories } = req.body;

      if (action === 'createDefaults') {
        const DEFAULT_MEALS = [
          { name: 'Café da manhã', target_calories: 400, meal_order: 1 },
          { name: 'Almoço', target_calories: 600, meal_order: 2 },
          { name: 'Lanche', target_calories: 200, meal_order: 3 },
          { name: 'Jantar', target_calories: 500, meal_order: 4 },
        ];

        const meals = await MealPlan.insertMany(
          DEFAULT_MEALS.map(meal => ({
            ...meal,
            user_id: userId,
            is_default: true,
          }))
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
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const mealPlan = await MealPlan.findByIdAndUpdate(id, updates, { new: true });
      return res.json({ data: { ...mealPlan?.toObject(), id: mealPlan?._id.toString() } });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await MealPlan.findByIdAndDelete(id);
      return res.json({ data: { success: true } });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Meal plans error:', error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}

function getUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    return Buffer.from(token, 'base64').toString();
  } catch {
    return null;
  }
}
