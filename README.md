# Consultoria SST

Plataforma web para gestão de Saúde e Segurança do Trabalho (SST), com foco em PGR, treinamentos e documentos.

## Visão geral

O projeto centraliza operações no backend (Express + PostgreSQL) e entrega frontend React para:

- gestão de PGRs (cadastro, edição e preview);
- gestão de empresas;
- gestão de treinamentos;
- alertas operacionais no dashboard;
- atualização de notícias SST do MTE no painel.

## Stack técnica

### Frontend

- React 19 + TypeScript
- Vite
- Wouter
- TanStack Query
- Tailwind CSS + Radix UI

### Backend

- Node.js + Express
- JWT para autenticação
- rotas multi-tenant

### Dados

- PostgreSQL (Supabase)
- Drizzle ORM
- Schema compartilhado em `shared/schema.ts`

## Funcionalidades principais

- Dashboard com indicadores de PGR.
- Card de "Treinamentos Vencendo" baseado em regra de data no backend.
- Card de "Atualizações SST (MTE)" consumindo notícias externas.
- CRUD de empresas, PGRs e treinamentos.
- Download de PDF de PGR (`/api/pgrs/:id/pdf`).

## Pré-requisitos

- Node.js 20+
- npm 10+
- banco PostgreSQL acessível via `DATABASE_URL`

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env` na raiz (exemplo mínimo):

```env
DATABASE_URL=
JWT_SECRET=
AUTH_BOOTSTRAP_USERNAME=admin
AUTH_BOOTSTRAP_PASSWORD=admin123
AUTH_ALLOW_SIGNUP=false
PORT=5000
NODE_ENV=development
```

3. (Opcional) Aplique migrações incrementais do projeto:

```bash
npm run db:migrate:incremental
```

4. (Opcional) Sincronize schema via Drizzle:

```bash
npm run db:push
```

## Como rodar em desenvolvimento

Use dois terminais:

1. Backend/API (porta 5000):

```bash
npm run dev
```

2. Frontend (porta 3000):

```bash
npm run dev:client
```

Acesse:

- Frontend: `http://127.0.0.1:3000`
- Backend API: `http://127.0.0.1:5000`

## Autenticação

- Rotas `/api/*` exigem Bearer token (exceto `/api/auth/*`).
- Login: `POST /api/auth/login`.
- Perfil atual: `GET /api/auth/me`.
- Em desenvolvimento, o usuário bootstrap é criado automaticamente quando `AUTH_BOOTSTRAP_USERNAME` e `AUTH_BOOTSTRAP_PASSWORD` estão definidos.

## Regra de vencimento de treinamentos (robusta)

A regra de "Treinamentos Vencendo" foi centralizada no backend:

- endpoint: `GET /api/trainings/expiring?window_days=7`
- cálculo por `training_date` (janela de próximos dias), não por texto fixo de UI;
- mesma fonte usada no Dashboard e na página de Treinamentos (`status=vencendo`);
- contagem de participantes baseada em `participants_count` (dado estruturado).

## Endpoints úteis

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/sst-news`
- `GET /api/trainings`
- `GET /api/trainings/expiring?window_days=7`
- `GET /api/pgrs`
- `GET /api/pgrs/:id/pdf`

## Scripts disponíveis

- `npm run dev` -> backend em modo desenvolvimento
- `npm run dev:client` -> frontend Vite na porta 3000
- `npm run build` -> build de produção
- `npm start` -> executa build (`dist/index.cjs`)
- `npm test` -> testes (Vitest)
- `npm run test:watch` -> testes em modo watch
- `npm run check` -> checagem TypeScript
- `npm run db:push` -> sincroniza schema Drizzle
- `npm run db:migrate:incremental` -> aplica migração incremental SQL

## Testes e qualidade

Comandos principais:

```bash
npm test
npm run check
```

## Estrutura do projeto

```text
client/            # aplicação React
server/            # API Express, auth, jobs e serviços
shared/            # schema e tipos compartilhados
script/            # scripts utilitários de build/migração
supabase/          # SQL e artefatos de banco
```

## Troubleshooting rápido

- Login mostrando erro 500: backend provavelmente não está em execução (`npm run dev`).
- Login com 401: credenciais inválidas.
- Frontend sem dados: valide token JWT e `DATABASE_URL`.

---

Para melhorias e bugs, abra uma issue no repositório.
