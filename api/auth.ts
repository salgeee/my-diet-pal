// Vercel Serverless Function para autenticação
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, User } from '../lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    if (req.method === 'POST') {
      const { action, email, password, name } = req.body;

      if (action === 'signup') {
        // Verificar se usuário já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Criar novo usuário (sem hash de senha por enquanto - para projeto pessoal)
        const user = await User.create({
          email,
          password, // Em produção, usar bcrypt para hash
          name,
          createdAt: new Date(),
        });

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
    }

    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const token = authHeader.replace('Bearer ', '');
      const userId = Buffer.from(token, 'base64').toString();
      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      return res.json({ 
        data: { 
          user: { id: user._id.toString(), email: user.email, name: user.name }
        } 
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(500).json({ 
      error: errorMessage.includes('MONGODB_URI') 
        ? 'Erro de configuração: Verifique se MONGODB_URI está definida no .env'
        : `Erro no servidor: ${errorMessage}` 
    });
  }
}
