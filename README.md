# SST Pro - Plataforma de Consultoria em SST

Aplicação web para gestão de Saúde e Segurança do Trabalho com foco em operação diária de consultoria: PGR, treinamentos, documentos técnicos e apoio normativo.

## Atualizações das últimas 24h (base: 20/02/2026)

- Novo fluxo completo de emissão de documentos derivados em `/documentos/novo?tipo=...` com formulário guiado e download de PDF.
- Novo catálogo de documentos em `client/src/pages/document-templates.ts`, incluindo base normativa e indicação de assinatura (`sim`, `ressalva`, `nao`).
- Nova rota backend `POST /api/documents/pdf` com validação de payload (`documentPdfPayloadSchema`) e resposta em `application/pdf`.
- Serviço de PDF expandido em `server/services/pdf.ts` para gerar:
  - PDF de PGR (`generatePgrPdf`)
  - PDF de documentos técnicos genéricos (`generateDocumentPdf`)
- Nova Central de Ajuda em `/ajuda` com:
  - onboarding rápido;
  - FAQ por módulo;
  - guia normativo TST completo (`?topico=guia-tst`).
- Cadastro de treinamentos reforçado por catálogo de NR (`shared/trainingNormCatalog.ts`) com:
  - carga horária mínima;
  - validade em meses;
  - cálculo automático de vencimento.
- Validação normativa de treinamentos no backend (`server/services/trainingNormValidation.ts`) em `POST/PUT /api/trainings`.
- Página de Empresas com validação de CNPJ, prevenção de duplicidade e ação "Salvar e criar PGR".
- Exclusão de PGR com opção de limpeza de empresa órfã (`DELETE /api/pgrs/:id?delete_orphan_company=1`).
- Cobertura de testes ampliada para ajuda, geração de documentos/PDF, autorização multi-tenant e regras de treinamento.
- Ajustes visuais no módulo de Configurações (botões e espaçamento do card).

## Funcionalidades atuais

- Dashboard com indicadores de PGR, treinamentos vencendo e notícias oficiais de SST (MTE).
- CRUD de empresas com vínculo opcional em treinamentos.
- Wizard de PGR (criação e edição) com inventário de riscos, plano de ação e preview.
- Preview de PGR com impressão e download de PDF.
- Gestão de treinamentos por NR com participantes estruturados e vencimento automático.
- Módulo de documentos derivados com geração assistida de PDF.
- Configurações administrativas por tenant.
- Autenticação JWT com escopo multi-tenant.

## Stack técnica

- Frontend: React 19, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, Radix UI.
- Backend: Node.js, Express, Zod.
- Dados: PostgreSQL (Supabase), Drizzle ORM, schema compartilhado em `shared/schema.ts`.
- Testes: Vitest (frontend + backend).

## Pré-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL acessível via `DATABASE_URL`

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie o arquivo `.env` na raiz:

```env
DATABASE_URL=
JWT_SECRET=
AUTH_BOOTSTRAP_USERNAME=admin
AUTH_BOOTSTRAP_PASSWORD=admin123
AUTH_ALLOW_SIGNUP=false
AUTH_BOOTSTRAP_TENANT_NAME=Tenant Inicial
PORT=5000
NODE_ENV=development
```

3. Opcional: sincronize schema/migrações:

```bash
npm run db:push
npm run db:migrate:incremental
```

## Execução em desenvolvimento

Modo recomendado (API + frontend no mesmo processo):

```bash
npm run dev
```

Acesso:

- App/API: `http://127.0.0.1:5000`

Modo alternativo (frontend separado):

```bash
npm run dev
npm run dev:client
```

## Endpoints principais

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/register` (quando `AUTH_ALLOW_SIGNUP=true`)
  - `GET /api/auth/me`
- Configurações:
  - `GET /api/settings`
  - `PUT /api/settings`
- Empresas:
  - `GET /api/companies`
  - `POST /api/companies`
  - `PUT /api/companies/:id`
  - `DELETE /api/companies/:id`
- PGR:
  - `GET /api/pgrs`
  - `GET /api/pgrs/:id`
  - `POST /api/pgrs`
  - `PUT /api/pgrs/:id`
  - `DELETE /api/pgrs/:id`
  - `GET /api/pgrs/:id/pdf`
- Documentos:
  - `POST /api/documents/pdf`
- Treinamentos:
  - `GET /api/trainings`
  - `GET /api/trainings/expiring?window_days=7`
  - `POST /api/trainings`
  - `PUT /api/trainings/:id`
  - `DELETE /api/trainings/:id`
- Notícias SST:
  - `GET /api/sst-news`

## Scripts úteis

- `npm run dev` - servidor de desenvolvimento (Express + Vite middleware)
- `npm run dev:client` - frontend Vite separado (porta 3000)
- `npm run build` - build de produção
- `npm start` - executa build em `dist/index.cjs`
- `npm test` - suíte de testes (Vitest)
- `npm run test:watch` - testes em watch mode
- `npm run check` - checagem TypeScript
- `npm run db:push` - sincroniza schema via Drizzle
- `npm run db:migrate:incremental` - aplica migração incremental SQL

## Qualidade

Comandos base:

```bash
npm run check
npm test
```

Execução mais recente da suíte local:

- `29` arquivos de teste aprovados
- `128` testes aprovados

## Estrutura do projeto

```text
client/     frontend React
server/     API Express, auth, jobs e serviços
shared/     schemas/tipos compartilhados (Zod + Drizzle)
script/     scripts de build/migração
supabase/   artefatos SQL
```

## Troubleshooting rápido

- `401 Unauthorized`: token ausente/expirado -> refaça login.
- `403 Forbidden` em `/api/settings`: usuário sem role `admin`.
- `500` em rotas de dados: validar `DATABASE_URL` e conexão do banco.
- Treinamento rejeitado em `POST/PUT /api/trainings`: revisar metadata normativa em `notes` (NR, carga horária, data e validade).
