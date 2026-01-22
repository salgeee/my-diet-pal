# 🚀 Guia de Deploy na Vercel

## ✅ O que já foi feito:
- ✅ Código commitado e enviado para o GitHub
- ✅ Projeto já está conectado à Vercel (projectId: prj_rRlr1lWsoybN3JK568UtLJsYHjFi)

## 📋 Passos para fazer o Deploy:

### 1. **Acesse o Dashboard da Vercel**
   - Vá para: https://vercel.com/dashboard
   - Encontre o projeto "my-diet-pal"

### 2. **Configure as Variáveis de Ambiente**
   Vá em **Settings → Environment Variables** e adicione:

   ```
   MONGODB_URI=mongodb+srv://salgeedev_db_user:Jfpkncm29J3EbYFY@cluster0.sbro0rs.mongodb.net/dietpal?retryWrites=true&w=majority
   ```

   ⚠️ **IMPORTANTE**: 
   - Marque para **Production**, **Preview** e **Development**
   - Substitua pela sua URI real do MongoDB Atlas (se for diferente)

### 3. **Verifique as Configurações de Build**
   A Vercel deve detectar automaticamente:
   - **Framework Preset**: Vite
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4. **Faça o Deploy**
   - Opção 1: **Automático** - A Vercel vai fazer deploy automaticamente quando você fizer push no GitHub
   - Opção 2: **Manual** - Vá em **Deployments** e clique em **Redeploy** no último deployment

### 5. **Verifique os Logs**
   Após o deploy, verifique os logs em **Deployments → [seu deployment] → Logs**
   
   Se houver erros, verifique:
   - ✅ Variável `MONGODB_URI` está configurada
   - ✅ Build está completando sem erros
   - ✅ As APIs estão sendo servidas corretamente

## 🔧 Estrutura do Projeto na Vercel:

```
/
├── api/              → Serverless Functions (Vercel)
│   ├── auth.ts
│   ├── daily-log.ts
│   ├── meal-plans.ts
│   ├── planned-foods.ts
│   ├── custom-foods.ts
│   └── profile.ts
├── lib/              → MongoDB connection
├── src/              → Frontend React
└── dist/             → Build output (gerado)
```

## 🐛 Troubleshooting:

### Erro: "MONGODB_URI não está definida"
- ✅ Verifique se a variável está configurada na Vercel
- ✅ Verifique se está marcada para Production

### Erro: "Cannot find module"
- ✅ Verifique se todas as dependências estão no `package.json`
- ✅ Verifique os logs de build

### APIs não funcionam
- ✅ Verifique se os arquivos em `api/` estão corretos
- ✅ Verifique os logs das serverless functions

## 📝 Comandos Úteis:

```bash
# Ver logs locais
npm run dev

# Testar build local
npm run build

# Verificar variáveis de ambiente
vercel env ls
```

## 🎉 Pronto!

Após o deploy, seu app estará disponível em:
- **Production**: https://my-diet-pal.vercel.app (ou seu domínio customizado)
- **Preview**: URLs geradas automaticamente para cada PR

---

**Dica**: A Vercel faz deploy automático a cada push no `main`! 🚀
