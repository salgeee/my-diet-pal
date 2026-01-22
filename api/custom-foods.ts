import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, CustomFood } from '../lib/mongodb.js';

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

    // GET - Listar alimentos personalizados
    if (req.method === 'GET') {
      const { search } = req.query;

      const query: any = { user_id };
      if (search && typeof search === 'string') {
        query.food_name = { $regex: search, $options: 'i' };
      }

      const customFoods = await CustomFood.find(query).sort({ food_name: 1 }).limit(50);

      return res.status(200).json({
        data: customFoods.map(food => ({
          id: food._id.toString(),
          user_id: food.user_id,
          food_name: food.food_name,
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g,
          brand: food.brand,
          created_at: food.created_at,
        })),
      });
    }

    // POST - Criar alimento personalizado
    if (req.method === 'POST') {
      const { food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, brand } = req.body;

      if (!food_name || calories_per_100g === undefined) {
        return res.status(400).json({ error: 'food_name e calories_per_100g são obrigatórios' });
      }

      // Verificar se já existe
      const existing = await CustomFood.findOne({ user_id, food_name: { $regex: `^${food_name}$`, $options: 'i' } });
      if (existing) {
        // Atualizar existente
        existing.calories_per_100g = calories_per_100g;
        existing.protein_per_100g = protein_per_100g || 0;
        existing.carbs_per_100g = carbs_per_100g || 0;
        existing.fat_per_100g = fat_per_100g || 0;
        if (brand) existing.brand = brand;
        await existing.save();

        return res.status(200).json({
          data: {
            id: existing._id.toString(),
            user_id: existing.user_id,
            food_name: existing.food_name,
            calories_per_100g: existing.calories_per_100g,
            protein_per_100g: existing.protein_per_100g,
            carbs_per_100g: existing.carbs_per_100g,
            fat_per_100g: existing.fat_per_100g,
            brand: existing.brand,
            created_at: existing.created_at,
          },
        });
      }

      const customFood = new CustomFood({
        user_id,
        food_name,
        calories_per_100g,
        protein_per_100g: protein_per_100g || 0,
        carbs_per_100g: carbs_per_100g || 0,
        fat_per_100g: fat_per_100g || 0,
        brand,
      });

      await customFood.save();

      return res.status(201).json({
        data: {
          id: customFood._id.toString(),
          user_id: customFood.user_id,
          food_name: customFood.food_name,
          calories_per_100g: customFood.calories_per_100g,
          protein_per_100g: customFood.protein_per_100g,
          carbs_per_100g: customFood.carbs_per_100g,
          fat_per_100g: customFood.fat_per_100g,
          brand: customFood.brand,
          created_at: customFood.created_at,
        },
      });
    }

    // DELETE - Remover alimento personalizado
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório' });
      }

      const customFood = await CustomFood.findOne({ _id: id, user_id });
      if (!customFood) {
        return res.status(404).json({ error: 'Alimento não encontrado' });
      }

      await CustomFood.findByIdAndDelete(id);

      return res.status(200).json({ message: 'Alimento removido com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro na API custom-foods:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
