# My Diet Pal

Aplicação de controle de dieta e calorias construída com React, TypeScript, MongoDB e Vercel.

## 🚀 Como rodar o projeto no seu PC

### Pré-requisitos

- **Node.js** (versão 18 ou superior) - [Baixar Node.js](https://nodejs.org/)
- **npm** (vem junto com o Node.js) ou **bun** (opcional)
- **Conta no MongoDB Atlas** (gratuita) - [Criar conta](https://www.mongodb.com/cloud/atlas/register)

### Passo a passo

1. **Instale as dependências do projeto**

   ```bash
   npm install
   ```

2. **Configure o MongoDB Atlas**

   - Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Crie um cluster gratuito (M0 - Free)
   - Crie um usuário de banco de dados
   - Adicione seu IP à whitelist (ou use `0.0.0.0/0` para desenvolvimento)
   - Clique em "Connect" e copie a connection string
   - A connection string será algo como: `mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority`

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` na raiz do projeto:

   ```env
   # MongoDB Connection String
   MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/dietpal?retryWrites=true&w=majority
   
   # Para desenvolvimento local, use a URL da API (deixe vazio para usar /api)
   VITE_API_URL=
   ```

   > ⚠️ **Importante**: Substitua `usuario`, `senha` e `cluster` pelos valores do seu MongoDB Atlas. O nome do banco (`dietpal`) pode ser qualquer um.

4. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**

   Abra seu navegador em: `http://localhost:8080`

   > 💡 **Nota**: Para desenvolvimento local, você precisará usar um proxy ou configurar o Vite para redirecionar `/api` para as serverless functions. Para produção na Vercel, isso funciona automaticamente.

### Outros comandos úteis

- `npm run build` - Cria uma versão de produção otimizada
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Verifica problemas no código
- `npm test` - Executa os testes

## 📦 Deploy na Vercel

1. **Faça push do código para o GitHub**

2. **Conecte o repositório na Vercel**

   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório do GitHub

3. **Configure as variáveis de ambiente na Vercel**

   - Na página do projeto, vá em "Settings" > "Environment Variables"
   - Adicione: `MONGODB_URI` com sua connection string do MongoDB Atlas

4. **Deploy!**

   A Vercel detectará automaticamente o projeto e fará o deploy. As API routes em `/api` serão automaticamente convertidas em serverless functions.

## 🛠️ Tecnologias utilizadas

- **Vite** - Build tool e dev server
- **React** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset do JavaScript com tipagem estática
- **shadcn-ui** - Componentes UI
- **Tailwind CSS** - Framework CSS utilitário
- **MongoDB Atlas** - Banco de dados NoSQL gratuito
- **Vercel** - Plataforma de deploy e serverless functions
- **React Router** - Roteamento para React
- **React Query** - Gerenciamento de estado do servidor

## 🔐 Segurança

> ⚠️ **Atenção**: Este projeto usa autenticação simples para projetos pessoais. As senhas são armazenadas em texto plano no banco de dados. Para produção, considere usar bcrypt para hash de senhas.

## 📝 Estrutura do Projeto

- `/src` - Código fonte do frontend React
- `/api` - Serverless functions para a Vercel
- `/lib` - Utilitários e configuração do MongoDB
- `/public` - Arquivos estáticos
