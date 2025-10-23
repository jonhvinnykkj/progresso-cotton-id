# Progresso Cotton - Sistema de Rastreabilidade

Sistema de rastreabilidade de fardos de algodão para o Grupo Progresso.

## 🚀 Desenvolvimento Local

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- PostgreSQL (ou use Neon/outro serviço de banco)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/jonhvinnykkj/progresso-cotton.git
cd progresso-cotton
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
# Especialmente a DATABASE_URL
```

4. **Configure o banco de dados**
```bash
# Push do schema para o banco
npm run db:push
```

### Executando o Projeto

**Desenvolvimento (recomendado):**
```bash
npm run dev
```

Isso irá iniciar:
- 🖥️ **Servidor**: http://localhost:5000 (API)
- 📱 **Cliente**: http://localhost:3000 (Interface)

**Apenas o cliente:**
```bash
npm run dev:client
```

**Apenas o servidor:**
```bash
npm run dev:server
```

### Scripts Disponíveis

- `npm run dev` - Inicia cliente e servidor simultaneamente
- `npm run dev:client` - Apenas o cliente (Vite)
- `npm run dev:server` - Apenas o servidor (Express)
- `npm run build` - Build do cliente para produção
- `npm run preview` - Preview do build de produção
- `npm run check` - Verificação de tipos TypeScript
- `npm run db:push` - Atualiza schema do banco

### Estrutura do Projeto

```
cotton-app/
├── client/           # Frontend React
│   ├── src/
│   └── index.html
├── server/           # Backend Express
│   ├── index.ts      # Servidor principal
│   ├── routes.ts     # Rotas da API
│   ├── db.ts         # Configuração do banco
│   └── storage.ts    # Camada de dados
├── shared/           # Código compartilhado
│   └── schema.ts     # Schemas Zod e Drizzle
└── public/           # Assets estáticos
```

### Tecnologias

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Query

**Backend:**
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL
- Zod

### Desenvolvimento

O projeto está configurado para desenvolvimento local com:
- Hot reload no frontend (Vite)
- Hot reload no backend (tsx)
- Proxy automático de `/api` para o servidor
- TypeScript em ambos os lados

### Banco de Dados

O projeto usa Drizzle ORM com PostgreSQL. Configure sua `DATABASE_URL` no arquivo `.env` e execute `npm run db:push` para criar as tabelas.

### Deploy

Para deploy em produção, use:
```bash
npm run build
npm start
```
