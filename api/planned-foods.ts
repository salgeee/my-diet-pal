import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, PlannedFood, MealPlan } from '../lib/mongodb.js';

// Helper para extrair user_id do token simples
function getUserIdFromToken(token: string): string | null {
  try {
    return Buffer.from(token, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // Extrair user_id do token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const user_id = getUserIdFromToken(token);

    if (!user_id) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // GET - Listar alimentos planejados
    if (req.method === 'GET') {
      const { meal_plan_id } = req.query;

      const query: any = { user_id };
      if (meal_plan_id) {
        query.meal_plan_id = meal_plan_id;
      }

      const plannedFoods = await PlannedFood.find(query).sort({ created_at: 1 });

      return res.status(200).json({
        data: plannedFoods.map(food => ({
          id: food._id.toString(),
          user_id: food.user_id,
          meal_plan_id: food.meal_plan_id,
          food_name: food.food_name,
          quantity_grams: food.quantity_grams,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          created_at: food.created_at,
        })),
      });
    }

    // POST - Criar alimento planejado
    if (req.method === 'POST') {
      const { meal_plan_id, food_name, quantity_grams, calories, protein, carbs, fat } = req.body;

      if (!meal_plan_id || !food_name || !quantity_grams || calories === undefined) {
        return res.status(400).json({ error: 'meal_plan_id, food_name, quantity_grams e calories são obrigatórios' });
      }

      // Verificar se o meal_plan pertence ao usuário
      const mealPlan = await MealPlan.findOne({ _id: meal_plan_id, user_id });
      if (!mealPlan) {
        return res.status(404).json({ error: 'Refeição não encontrada' });
      }

      const plannedFood = new PlannedFood({
        user_id,
        meal_plan_id,
        food_name,
        quantity_grams,
        calories,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
      });

      await plannedFood.save();

      // Atualizar target_calories da refeição
      const allPlannedFoods = await PlannedFood.find({ meal_plan_id });
      const totalCalories = allPlannedFoods.reduce((sum, food) => sum + food.calories, 0);
      await MealPlan.findByIdAndUpdate(meal_plan_id, { target_calories: totalCalories });

      return res.status(201).json({
        data: {
          id: plannedFood._id.toString(),
          user_id: plannedFood.user_id,
          meal_plan_id: plannedFood.meal_plan_id,
          food_name: plannedFood.food_name,
          quantity_grams: plannedFood.quantity_grams,
          calories: plannedFood.calories,
          protein: plannedFood.protein,
          carbs: plannedFood.carbs,
          fat: plannedFood.fat,
          created_at: plannedFood.created_at,
        },
      });
    }

    // PUT - Atualizar alimento planejado
    if (req.method === 'PUT') {
      const { id, food_name, quantity_grams, calories, protein, carbs, fat } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' });
      }

      const plannedFood = await PlannedFood.findOne({ _id: id, user_id });
      if (!plannedFood) {
        return res.status(404).json({ error: 'Alimento não encontrado' });
      }

      if (food_name !== undefined) plannedFood.food_name = food_name;
      if (quantity_grams !== undefined) plannedFood.quantity_grams = quantity_grams;
      if (calories !== undefined) plannedFood.calories = calories;
      if (protein !== undefined) plannedFood.protein = protein;
      if (carbs !== undefined) plannedFood.carbs = carbs;
      if (fat !== undefined) plannedFood.fat = fat;

      await plannedFood.save();

      // Atualizar target_calories da refeição
      const allPlannedFoods = await PlannedFood.find({ meal_plan_id: plannedFood.meal_plan_id });
      const totalCalories = allPlannedFoods.reduce((sum, food) => sum + food.calories, 0);
      await MealPlan.findByIdAndUpdate(plannedFood.meal_plan_id, { target_calories: totalCalories });

      return res.status(200).json({
        data: {
          id: plannedFood._id.toString(),
          user_id: plannedFood.user_id,
          meal_plan_id: plannedFood.meal_plan_id,
          food_name: plannedFood.food_name,
          quantity_grams: plannedFood.quantity_grams,
          calories: plannedFood.calories,
          protein: plannedFood.protein,
          carbs: plannedFood.carbs,
          fat: plannedFood.fat,
          created_at: plannedFood.created_at,
        },
      });
    }

    // DELETE - Remover alimento planejado
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' });
      }

      const plannedFood = await PlannedFood.findOne({ _id: id, user_id });
      if (!plannedFood) {
        return res.status(404).json({ error: 'Alimento não encontrado' });
      }

      const meal_plan_id = plannedFood.meal_plan_id;
      await PlannedFood.findByIdAndDelete(id);

      // Atualizar target_calories da refeição
      const allPlannedFoods = await PlannedFood.find({ meal_plan_id });
      const totalCalories = allPlannedFoods.reduce((sum, food) => sum + food.calories, 0);
      await MealPlan.findByIdAndUpdate(meal_plan_id, { target_calories: totalCalories });

      return res.status(200).json({ message: 'Alimento removido com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro na API planned-foods:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
