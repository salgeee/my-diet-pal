# Guia de Configuração - My Diet Pal

## 🎯 Resumo

Este projeto foi migrado do Supabase para **MongoDB Atlas** + **Vercel Serverless Functions** para facilitar o deploy e reduzir dependências.

## 📋 Checklist de Configuração

### 1. MongoDB Atlas (Gratuito)

- [ ] Criar conta em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- [ ] Criar um cluster M0 (Free)
- [ ] Criar usuário de banco de dados
- [ ] Adicionar IP à whitelist (use `0.0.0.0/0` para desenvolvimento)
- [ ] Copiar connection string

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/dietpal?retryWrites=true&w=majority
VITE_API_URL=
```

### 3. Instalação

```bash
npm install
```

### 4. Desenvolvimento Local

**Opção 1: Usando Vercel CLI (Recomendado)**

```bash
# Instale o Vercel CLI globalmente
npm i -g vercel

# Rode o projeto localmente
vercel dev
```

Isso iniciará tanto o frontend quanto as API routes.

**Opção 2: Usando apenas o frontend (sem APIs)**

```bash
npm run dev
```

> ⚠️ As APIs não funcionarão localmente sem o Vercel CLI ou um servidor Node.js separado.

### 5. Deploy na Vercel

1. Faça push para o GitHub
2. Conecte o repositório na Vercel
3. Adicione a variável `MONGODB_URI` nas Environment Variables
4. Deploy automático!

## 🔧 Estrutura das APIs

As APIs estão em `/api` e são automaticamente convertidas em serverless functions pela Vercel:

- `/api/auth` - Autenticação (signup, signin)
- `/api/profile` - Perfil do usuário
- `/api/daily-log` - Logs diários e alimentos
- `/api/meal-plans` - Planos de refeição

## 🐛 Troubleshooting

### Erro: "Cannot find module '../lib/mongodb'"

Certifique-se de que o arquivo `lib/mongodb.ts` existe na raiz do projeto.

### Erro: "MONGODB_URI is not defined"

Verifique se o arquivo `.env` existe e contém `MONGODB_URI`.

### APIs não funcionam localmente

Use `vercel dev` ou configure um proxy no Vite (já configurado para `http://localhost:3000`).

## 📚 Recursos

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel CLI](https://vercel.com/docs/cli)
