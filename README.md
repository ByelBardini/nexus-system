# Nexus System

Stack: **Server** (NestJS + Prisma + MySQL) e **Client** (React + Vite + TypeScript + Tailwind + shadcn/ui).

## Pré-requisitos

- Node.js 18+
- MySQL (ou Docker) para o backend
- npm (ou pnpm)

## Rodar tudo (server + client)

Na raiz do projeto:

```bash
npm run dev
```

Inicia o server (Nest) e o client (Vite) em paralelo. Server em http://localhost:3000, client em http://localhost:5173.

## Server (Backend)

```bash
cd server
cp .env.example .env   # Ajuste DATABASE_URL, JWT_SECRET, PORT
npm install
npm run prisma:generate
npm run start:dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api  

## Client (Frontend)

```bash
cd client
cp .env.example .env   # Opcional: VITE_API_URL (padrão para chamadas à API)
npm install
npm run dev
```

- App: http://localhost:5173  

## Scripts úteis (server)

- `npm run prisma:migrate` — cria/aplica migrations
- `npm run prisma:studio` — abre Prisma Studio
