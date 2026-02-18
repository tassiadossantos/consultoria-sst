# Consultoria SST

Plataforma para gestão de Saúde e Segurança do Trabalho.

## Instalação

1. Clone o repositório:
	 ```bash
	 git clone https://github.com/tassiadossantos/consultoria-sst.git
	 ```
2. Instale dependências:
	 ```bash
	 npm install
	 ```
3. Configure variáveis de ambiente em `.env`.
4. Execute migrações SQL:
	 ```bash
	 psql < supabase/2026-02-17_settings.sql
	 ```
5. Rode o backend:
	 ```bash
	 npm run dev
	 ```
6. Rode o frontend:
	 ```bash
	 npm run dev:client
	 ```

## Testes

- Testes unitários e de integração:
	```bash
	npm test
	```
- Testes end-to-end (Playwright):
	```bash
	npx playwright test client/e2e/
	```
- Testes de carga (k6):
	```bash
	k6 run client/e2e/carga.k6.js
	```

## Deploy

- Configure variáveis de ambiente para produção.
- Execute as migrações.
- Rode scripts de build e deploy conforme sua infraestrutura.

## CI/CD

- Configure GitHub Actions com workflow:
	```yaml
	name: CI
	on: [push, pull_request]
	jobs:
		test:
			runs-on: ubuntu-latest
			steps:
				- uses: actions/checkout@v3
				- name: Setup Node.js
					uses: actions/setup-node@v3
					with:
						node-version: '18'
				- run: npm install
				- run: npm test
	```

## Releases

- Crie tags para versões estáveis:
	```bash
	git tag v1.0.0
	git push --tags
	```

## Organização

- Use issues e projetos do GitHub para planejar novas funcionalidades e correções.
- Revise permissões para garantir colaboração segura.

---

Para dúvidas ou sugestões, abra uma issue no repositório.
# consultoria-sst

Plataforma web para gestão de SST com foco em **PGR (Programa de Gerenciamento de Riscos)**, acompanhamento de treinamentos e organização de documentos derivados.

## Visão geral

O projeto entrega um painel operacional para consultoria SST com fluxo orientado a:

- criação e manutenção de PGRs;
- inventário e avaliação de riscos ocupacionais;
- plano de ação e monitoramento;
- controle de treinamentos;
- emissão de documentos complementares.

Atualmente, o CRUD de dados é centralizado no backend (API Express + PostgreSQL).

## Stack técnica

### Frontend

- React 19 + TypeScript
- Vite
- Wouter (roteamento)
- TanStack Query (estado assíncrono)
- Tailwind CSS + componentes UI (Radix)

### Backend

- Node.js + Express
- servidor HTTP único para API + app web
- modo dev com integração Vite middleware
- modo produção servindo arquivos estáticos de `dist`

### Dados

- PostgreSQL (Supabase) via `DATABASE_URL`
- Drizzle ORM + schema compartilhado (`shared/schema.ts`)

## Funcionalidades principais

- Dashboard com indicadores de PGR, vencimentos e pendências.
- Lista de PGR com filtros por status e busca.
- Wizard de PGR (6 etapas): empresa, perigos, avaliação, controle, plano e monitoramento.
- Edição de PGR existente e preview do documento.
- Gestão de treinamentos com alertas de vencimento.
- Catálogo de documentos derivados (OS, APR, Ficha de EPI, POP).

## Rotas da aplicação

- `/` → Dashboard
- `/pgr` → Lista de PGR
- `/pgr/novo` → Novo PGR
- `/pgr/:id/editar` → Edição de PGR
- `/pgr/:id/preview` → Preview do PGR
- `/empresas` → Empresas
- `/treinamentos` → Treinamentos
- `/documentos` → Documentos derivados
- `/atualizacao-normativa` → Nota técnica/atualização normativa

## Pré-requisitos

- Node.js 20+
- npm 10+

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie um arquivo `.env` na raiz:

```env
# Backend / banco
DATABASE_URL=

# Auth centralizada (JWT)
JWT_SECRET=
AUTH_BOOTSTRAP_USERNAME=
AUTH_BOOTSTRAP_PASSWORD=
# AUTH_ALLOW_SIGNUP=true  # opcional: permite criar usuários via /api/auth/register

# Servidor
PORT=5000
NODE_ENV=development
```

Autenticação:

- A API exige token Bearer JWT em `/api/*` (exceto `/api/auth/*`).
- Faça login em `/api/auth/login` e use o token retornado no header `Authorization`.
- Em desenvolvimento, o usuário bootstrap é criado automaticamente quando `AUTH_BOOTSTRAP_USERNAME` e `AUTH_BOOTSTRAP_PASSWORD` são definidos.

3. Execute em desenvolvimento:

```bash
npm run dev
```

A aplicação sobe em `http://localhost:5000`.

## Scripts disponíveis

- `npm run dev` → inicia servidor Express + frontend (desenvolvimento)
- `npm run dev:client` → inicia apenas Vite (porta 5000)
- `npm run build` → build de produção
- `npm start` → executa build (`dist/index.cjs`)
- `npm test` → roda testes com Vitest
- `npm run test:watch` → testes em watch mode
- `npm run check` → checagem TypeScript
- `npm run db:push` → aplica schema com Drizzle Kit

## Estrutura do projeto

```text
client/            # Aplicação React
	src/
		pages/         # Páginas de negócio (dashboard, pgr, treinamentos...)
		components/    # Layout e biblioteca de UI
		lib/           # Integrações de API e utilitários

server/            # Servidor Express e bootstrap da aplicação
shared/            # Schemas/types compartilhados
script/            # Scripts de build
supabase/          # SQL e artefatos de banco
```

## Testes e qualidade

- Testes unitários/componentes com **Vitest** e **Testing Library**.
- Arquivos de teste distribuídos em `client/src/**/*.test.ts(x)`.

Comandos rápidos:

```bash
npm test
npm run check
```

## Estado atual de arquitetura

- O CRUD de PGR, empresas e treinamentos está centralizado na API em `server/routes.ts`.
- O frontend consome a API via `client/src/lib/api.ts` e `client/src/lib/pgr.ts`.
- O schema compartilhado em `shared/schema.ts` é usado no frontend e backend.

## Próximos passos sugeridos

- Implementar API server-side para PGR e empresas em `server/routes.ts`.
- Consolidar schema em `shared/schema.ts` para refletir entidades de SST.
- Centralizar autenticação/autorização.
- Incluir CI com etapas de `test` e `check`.

---

# consultoria-sst (EN)

Web platform for Occupational Health & Safety management, focused on **PGR (Risk Management Program)**, training follow-up, and derived document organization.

## Overview

This project provides an operational dashboard for an H&S consultancy with flows focused on:

- creating and maintaining PGRs;
- hazard inventory and occupational risk assessment;
- action planning and monitoring;
- training control;
- issuing complementary documents.

The application now centralizes CRUD operations in the backend (Express API + PostgreSQL).

## Tech stack

### Frontend

- React 19 + TypeScript
- Vite
- Wouter (routing)
- TanStack Query (async state)
- Tailwind CSS + UI components (Radix)

### Backend

- Node.js + Express
- single HTTP server for API + web app
- dev mode with Vite middleware integration
- production mode serving static assets from `dist`

### Data

- PostgreSQL (Supabase) via `DATABASE_URL`
- Drizzle ORM + shared schema (`shared/schema.ts`)

## Main features

- Dashboard with PGR, expiration, and pending indicators.
- PGR list with status filters and search.
- PGR wizard (6 steps): company, hazards, assessment, controls, plan, and monitoring.
- Existing PGR editing and document preview.
- Training management with expiration alerts.
- Derived documents catalog (Work Order, APR, PPE Record, SOP).

## Application routes

- `/` → Dashboard
- `/pgr` → PGR list
- `/pgr/novo` → New PGR
- `/pgr/:id/editar` → PGR edit
- `/pgr/:id/preview` → PGR preview
- `/empresas` → Companies
- `/treinamentos` → Trainings
- `/documentos` → Derived documents
- `/atualizacao-normativa` → Regulatory update page

## Prerequisites

- Node.js 20+
- npm 10+

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file at the root:

```env
# Backend / database
DATABASE_URL=

# Centralized auth (JWT)
JWT_SECRET=
AUTH_BOOTSTRAP_USERNAME=
AUTH_BOOTSTRAP_PASSWORD=
# AUTH_ALLOW_SIGNUP=true  # optional: allows signup via /api/auth/register

# Server
PORT=5000
NODE_ENV=development
```

Authentication:

- API requires Bearer JWT for `/api/*` (except `/api/auth/*`).
- Login via `/api/auth/login` and send returned token in `Authorization` header.
- In development, a bootstrap user is auto-created when `AUTH_BOOTSTRAP_USERNAME` and `AUTH_BOOTSTRAP_PASSWORD` are set.

3. Run in development:

```bash
npm run dev
```

The app runs at `http://localhost:5000`.

## Available scripts

- `npm run dev` → starts Express server + frontend (development)
- `npm run dev:client` → starts only Vite (port 5000)
- `npm run build` → production build
- `npm start` → runs build (`dist/index.cjs`)
- `npm test` → runs test suite with Vitest
- `npm run test:watch` → tests in watch mode
- `npm run check` → TypeScript check
- `npm run db:push` → pushes schema with Drizzle Kit

## Project structure

```text
client/            # React application
	src/
		pages/         # Business pages (dashboard, pgr, trainings...)
		components/    # Layout and UI library
		lib/           # API integrations and utilities

server/            # Express server and bootstrap
shared/            # Shared schemas/types
script/            # Build scripts
supabase/          # SQL and database artifacts
```

## Testing and quality

- Unit/component tests with **Vitest** and **Testing Library**.
- Test files are distributed in `client/src/**/*.test.ts(x)`.

Quick commands:

```bash
npm test
npm run check
```

## Current architecture status

- PGR, companies, and trainings CRUD are centralized in `server/routes.ts`.
- The frontend consumes backend APIs through `client/src/lib/api.ts` and `client/src/lib/pgr.ts`.
- Shared domain contracts in `shared/schema.ts` are used by both frontend and backend.

## Suggested next steps

- Implement server-side API for PGR and companies in `server/routes.ts`.
- Consolidate schema in `shared/schema.ts` to reflect H&S entities.
- Centralize authentication/authorization.
- Add CI with `test` and `check` stages.
