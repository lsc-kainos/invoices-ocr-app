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

# 2) variáveis: um único .env.local na raiz alimenta web e api
cp .env.example .env.local
#    → preencher os secrets (NEXTAUTH_SECRET, GOOGLE_*, GITHUB_*, etc)
npm run env:link
#    → cria symlinks apps/web/.env.local e apps/api/.env apontando
#      pra raiz, então qualquer ferramenta (Next, Nest, Prisma, Playwright)
#      lê a mesma fonte

# 3) sobe Postgres, espera healthcheck, roda migrate (e seed se houver)
npm run db:setup

# 4) sobe web (:3000) e api (:3001) em paralelo
npm run dev
```

> Tanto `.env.local` na raiz quanto os symlinks em `apps/*` são gitignored.
> Em produção (Railway), cada service recebe env vars via dashboard — o
> arquivo local não é usado.

### Auth setup local (F1)

A F1 ativa OAuth Google + GitHub. Antes do primeiro login você precisa:

1. **Gerar `NEXTAUTH_SECRET`** (mesmo valor em web e api):

   ```bash
   openssl rand -base64 32
   ```

2. **Google Cloud Console** → APIs & Services → Credentials → Create OAuth 2.0
   Client ID (Web application). Authorized redirect URI:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

   Copiar Client ID/Secret para `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` em
   `apps/web/.env.local`.

3. **GitHub** → Settings → Developer settings → OAuth Apps → New OAuth App.
   Authorization callback URL:

   ```
   http://localhost:3000/api/auth/callback/github
   ```

   Copiar Client ID/Secret para `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`.

4. **`ADMIN_EMAILS`** (CSV, opcional): e-mails listados são promovidos a `ADMIN`
   no `signIn` callback. Os demais ficam como `USER`.

5. **Smoke**: `npm run dev`, abrir `http://localhost:3000` → redireciona para
   `/login`. Click "Continuar com Google" ou "Continuar com GitHub" → autoriza →
   home com saudação. `curl -i http://localhost:3001/api/v1/me` sem token → 401.

> Em produção (Railway), configurar as mesmas variáveis nos dois services e
> adicionar o domínio Railway às authorized redirect URIs do Google e GitHub.

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
- Web e2e (Playwright, requer Postgres + envs): `npm --workspace=@invoices-ocr/web run test:e2e`

## Smoke local

- `http://localhost:3000/` sem cookie → redireciona para `/login`.
- Login Google ou GitHub → volta para `/` com saudação "Bem-vindo, ...".
- `curl http://localhost:3001/health` retorna `{"status":"ok","ts":"..."}` (executa `SELECT 1` via Prisma; rota pública).
- `curl -i http://localhost:3001/api/v1/me` sem `Authorization: Bearer` → 401.
- UserMenu (avatar topo direito) → "Sair" → volta para `/login`.

## Deploy

Containers via Dockerfile multi-stage (`apps/web/Dockerfile`, `apps/api/Dockerfile`). `railway.json` declara os 2 services para Railway com healthcheck em `/` (web) e `/health` (api). O api roda `prisma migrate deploy` no startup do container.

## Documentação

- Spec original do case: `docs/paggo-ocr-case-spec.md`
- Plano-mestre das fases: `docs/superpowers/specs/2026-05-07-plano-detalhamento-specs.md`
- Spec da fase atual (Skeleton): `docs/superpowers/specs/2026-05-07-fase-0.5-skeleton.md`
- Spec da F1 (Auth): `docs/superpowers/specs/2026-05-07-fase-1-auth.md`
- Design tokens e mockups: `docs/claude-design/`
