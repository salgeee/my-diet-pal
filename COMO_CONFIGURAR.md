# ⚠️ ERRO 500 - Como Resolver

O erro 500 que você está vendo é porque **falta configurar o MongoDB**.

## 🔧 Solução Rápida

### 1. Criar conta no MongoDB Atlas (gratuito)

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Crie um cluster **M0 Free** (gratuito)
4. Crie um usuário de banco de dados (Database Access)
5. Adicione seu IP à whitelist (Network Access) - use `0.0.0.0/0` para desenvolvimento
6. Clique em "Connect" > "Connect your application"
7. Copie a connection string (algo como: `mongodb+srv://usuario:senha@cluster.mongodb.net/...`)

### 2. Criar arquivo `.env` na raiz do projeto

Crie um arquivo chamado `.env` (sem extensão) na pasta raiz do projeto com:

```env
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@cluster.mongodb.net/dietpal?retryWrites=true&w=majority
```

**Substitua:**
- `seu-usuario` pelo usuário que você criou
- `sua-senha` pela senha que você criou
- `cluster` pelo nome do seu cluster

### 3. Reiniciar o servidor

Pare o `vercel dev` (Ctrl+C) e rode novamente:

```powershell
vercel dev
```

## ✅ Pronto!

Agora as APIs devem funcionar. O erro 500 acontecia porque o código tentava conectar ao MongoDB mas não encontrava a variável `MONGODB_URI`.

## 🐛 Ainda com erro?

Verifique no terminal onde está rodando `vercel dev` - os erros aparecem lá com mais detalhes.
