# invoices-ocr-app

OCR + LLM chat sobre invoices — case técnico Paggo.

## Stack

- Monorepo: npm workspaces + Turborepo
- `apps/web`: Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + next-themes + next-intl (pt-BR)
- `apps/api`: NestJS 11 + Prisma 6 + helmet + Throttler + class-validator + zod
- `packages/shared-types`: DTOs compartilhados
- DB local: Postgres 16 via docker-compose
- Deploy: Railway (Dockerfiles + `railway.json`)

## Pré-requisitos

- Node 22 (ver `.nvmrc`)
- npm 10+
- Docker + Docker Compose v2

## Setup local

```bash
# 1) clone, depois na raiz:
nvm use
npm install

# 2) variáveis: copia o template para os dois apps
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 3) sobe Postgres, espera healthcheck, roda migrate (e seed se houver)
npm run db:setup

# 4) sobe web (:3000) e api (:3001) em paralelo
npm run dev
```

> O `.env.example` tem dois blocos comentados (`# === apps/api ===` e
> `# === apps/web ===`). Em cada cópia, mantenha apenas o bloco do app
> correspondente — ambas as cópias são gitignored.

## Comandos úteis

| Comando                                                                 | O que faz                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run db:up` / `npm run db:down`                                     | sobe / derruba o container do Postgres                                                                       |
| `npm run db:setup`                                                      | sobe Postgres, aguarda healthy, roda `prisma migrate deploy` (idempotente) e `prisma db seed` se configurado |
| `npm run db:studio`                                                     | abre Prisma Studio em `:5555`                                                                                |
| `npm run lint` / `npm run typecheck` / `npm run build` / `npm run test` | turbo executa em todos os workspaces                                                                         |
| `npm run format` / `npm run format:check`                               | Prettier em tudo                                                                                             |

### Testes

- API (Jest): `npm --workspace=@invoices-ocr/api run test`
- API e2e (Jest + Postgres rodando): `cd apps/api && DATABASE_URL=... npm run test:e2e`
- Web (Vitest + Testing Library): `npm --workspace=@invoices-ocr/web run test`

## Smoke local

- `http://localhost:3000` mostra placeholder Instrument Serif sobre fundo dark com Topbar estática (nav e search desabilitados na F0.5).
- `curl http://localhost:3001/health` retorna `{"status":"ok","ts":"..."}` (executa `SELECT 1` via Prisma).

## Deploy

Containers via Dockerfile multi-stage (`apps/web/Dockerfile`, `apps/api/Dockerfile`). `railway.json` declara os 2 services para Railway com healthcheck em `/` (web) e `/health` (api). O api roda `prisma migrate deploy` no startup do container.

## Documentação

- Spec original do case: `docs/paggo-ocr-case-spec.md`
- Plano-mestre das fases: `docs/superpowers/specs/2026-05-07-plano-detalhamento-specs.md`
- Spec da fase atual (Skeleton): `docs/superpowers/specs/2026-05-07-fase-0.5-skeleton.md`
- Spec da F1 (Auth): `docs/superpowers/specs/2026-05-07-fase-1-auth.md`
- Design tokens e mockups: `docs/claude-design/`
