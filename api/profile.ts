import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, Profile } from '../lib/mongodb';

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
      const profile = await Profile.findOne({ user_id: userId });
      return res.json({ data: profile });
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      const profile = await Profile.findOneAndUpdate(
        { user_id: userId },
        { ...updates, updated_at: new Date() },
        { new: true, upsert: true }
      );
      return res.json({ data: profile });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Profile error:', error);
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
