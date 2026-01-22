import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, DailyLog, FoodEntry } from '../lib/mongodb.js';

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
    // Para GET, pegar date do query. Para POST, pegar do body ou query
    const { date: queryDate, action: queryAction, days } = req.query;
    const bodyDate = req.body && typeof req.body === 'object' && 'date' in req.body 
      ? (req.body as { date?: string }).date 
      : undefined;
    const dateStr = (queryDate as string) || bodyDate || new Date().toISOString().split('T')[0];

    if (req.method === 'GET') {
      // Buscar histórico dos últimos X dias
      if (queryAction === 'history') {
        const numDays = parseInt(days as string) || 30;
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
    }

    if (req.method === 'POST') {
      const { action } = req.body;

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

        const { food_name, quantity_grams, calories, protein, carbs, fat, meal_plan_id } = req.body;
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
    }

    if (req.method === 'DELETE') {
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
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Daily log error:', error);
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
