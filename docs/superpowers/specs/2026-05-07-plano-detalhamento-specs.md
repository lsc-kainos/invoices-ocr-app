# Plano-mestre — Detalhamento das specs

**Data:** 2026-05-07
**Fonte de verdade:** `docs/paggo-ocr-case-spec.md`
**Escopo deste documento:** índice ordenado das fases de desenvolvimento. Cada fase vai gerar um doc de spec próprio, escrito **antes** da implementação da fase, em sessão dedicada.

## Decisões fundacionais que guiam o plano

- **Iteração vertical:** cada fase entrega uma feature ponta-a-ponta (web + api + db).
- **Granularidade:** uma spec detalhada por fase.
- **Cross-cutting embutido:** tema, i18n via `t()`, ownership-check em todas as queries Prisma, magic bytes, signed URLs com TTL e rate limits acompanham a fase em que a feature aparece — não viram dívida pra retrofitar no fim.
- **Deploy desde a F0:** Railway com web + api + Postgres + volume no ar antes de qualquer feature de domínio.
- **Schema Prisma evolui por fase:** F0 só `User` placeholder; cada fase adiciona/completa modelos conforme entrega.
- **Decisões arquiteturais não fechadas neste plano:** localização da sessão (NextAuth web vs Nest validador), formato do download (PDF único vs ZIP), streaming do chat — fecham na spec da fase correspondente.

## Fluxo de trabalho

1. Para cada fase abaixo, em sessão dedicada: escrever a spec detalhada (em `docs/superpowers/specs/`).
2. A spec passa por aprovação do usuário antes de virar plano de implementação.
3. Implementar com testes nos fluxos críticos.
4. Fase seguinte só começa depois da anterior estar verde (CI + manual smoke).

---

## F0 — Bootstrap do monorepo

**Plano de implementação:** `2026-05-07-monorepo-bootstrap.md` (já em execução).

Escopo (entregue por esse plano, não por uma spec separada):

- Monorepo `npm workspaces` + Turborepo, layout `apps/web` (Next.js 16, App Router, Tailwind), `apps/api` (NestJS 11), `packages/shared-types`.
- Tooling dia 0: ESLint, Prettier (com `prettier-plugin-tailwindcss`), Husky, lint-staged, commitlint (conventional commits), `.editorconfig`, `.nvmrc`.
- GitHub Actions: lint, typecheck, build em PRs.
- Repositório no GitHub, push inicial, CI verde.

**Não entrega** (vai pra F0.5): shadcn, NextAuth, Prisma, helmet, throttler, class-validator, next-themes, next-intl, tema Paggo, Railway/deploy.

## F0.5 — Skeleton (frontend + backend base)

**Spec a escrever:** `2026-05-07-fase-0.5-skeleton.md`

Pré-requisito da F1 e seguintes. **Não entrega valor de usuário sozinha** — é a base compartilhada que todas as features verticais consomem.

Escopo:

- **Frontend:**
  - shadcn/ui init em `apps/web` + paleta OKLCH cobre/conhaque (vinda de `docs/claude-design/reference/globals.css` + `tokens.css`).
  - Fonts: Geist + Geist Mono + Instrument Serif italic.
  - Primitives shadcn portados: Button, Input, Badge, Card, Tabs, Avatar, Separator, Progress, DropdownMenu, Dialog (mínimo necessário pras telas de F1+F2).
  - next-themes (provider + dark default) e next-intl (provider + `messages/pt-BR.json` vazio mas funcional, helper `t()` no client e server).
  - Layout root mínimo (`app/layout.tsx`) aplicando tokens, fonts, theme provider, intl provider.
- **Backend:**
  - Prisma init (`prisma/schema.prisma` com `datasource` + `generator`, sem models ainda — models entram nas fases que os usam).
  - Módulos esqueleto no Nest: `AuthModule`, `UsersModule` (vazios, prontos para F1).
  - `helmet` aplicado no bootstrap.
  - `@nestjs/throttler` registrado globalmente com baseline (60/min default).
  - `class-validator` + `class-transformer` + `ValidationPipe` global com `whitelist: true, forbidNonWhitelisted: true`.
  - CORS via `ALLOWED_ORIGINS` env (lista por vírgula, sem wildcard em prod).
  - `/health` endpoint público.
- **Dev local:**
  - `docker-compose.yml` na raiz subindo Postgres 16 (porta 5432, volume nomeado, healthcheck) e, opcionalmente desde já, um Adminer pra inspeção visual.
  - `.env.example` na raiz documentando **todas** as variáveis do monorepo, organizadas por escopo (`# === apps/web ===`, `# === apps/api ===`, `# === compartilhada ===`).
  - Convenção por app: `apps/web/.env.local` (Next lê automaticamente, ignorada pelo git) e `apps/api/.env` (Nest + Prisma, ignorada pelo git). Ambas com base em `.env.example` da raiz.
  - Scripts raiz:
    - `db:up` → `docker compose up -d postgres`
    - `db:down` → `docker compose down`
    - `db:setup` → `bash scripts/db-setup.sh` (sobe Postgres, aguarda healthy, roda `prisma migrate deploy` em dev/local equivalente, e `prisma db seed` **se** `prisma.seed` estiver configurado em `apps/api/package.json`).
    - `scripts/db-setup.sh`: bash idempotente, com `set -euo pipefail`, espera ativa pelo healthcheck do Postgres (loop com `docker compose ps --format json` checando `Health.Status == healthy`, timeout configurável), depois invoca os steps Prisma. Seed é opcional: detecta a existência via `node -e "const p = require('./apps/api/package.json'); process.exit(p.prisma?.seed ? 0 : 1)"` e só roda se `0`.
  - README com seção "Setup local em 4 passos": clone → `npm install` → `cp .env.example apps/web/.env.local apps/api/.env` (e preencher) → `npm run db:setup && npm run dev`.
- **Deploy Railway:** web + api + Postgres + volume no ar. Smoke: GET `/` no web (placeholder), GET `/health` no api retorna 200. Variáveis configuradas no Railway separadas dos `.env` locais.
- **Sem auth ainda.** Páginas e endpoints rodam abertos — F1 protege.

## F1 — Auth

**Spec a escrever:** `2026-05-07-fase-1-auth.md`

Escopo (assume F0.5 pronta):

- Decisões fechadas: sessão **JWT do NextAuth**, transporte **`Authorization: Bearer`** server-side fetch do Next pro Nest, **sem Prisma adapter** (só model `User`), bootstrap ADMIN via `ADMIN_EMAILS` env, redirect pós-login pra `/`, mock OAuth pra E2E via Credentials Provider só em `NODE_ENV=test`.
- NextAuth no `apps/web` com providers Google + GitHub, `NEXTAUTH_SECRET` forte, sessão JWT 7 dias com `updateAge` 24h.
- Schema Prisma — model `User` completo (id cuid, email unique, name, avatar, role enum `USER|ADMIN`, timestamps).
- Callbacks NextAuth: `signIn` faz upsert do User + promove ADMIN se email ∈ `ADMIN_EMAILS`; `jwt` enriquece token com `sub` (user.id) e `role`; `session` espelha pra cliente.
- Middleware Next protege `app/(authed)/*` (redirect pra `/login?callbackUrl=...` se não logado).
- Rate limit `/api/auth/*`: 5 req/min por IP (in-memory na F1, Upstash/Redis no backlog).
- Validação no Nest: `JwtStrategy` (Passport) decodifica com `NEXTAUTH_SECRET` compartilhado, busca User no DB pelo `sub`. `JwtAuthGuard` global + `@Public()` opt-out (rotas públicas: `/health`). `@CurrentUser()` decorator. `RolesGuard` + `@Roles('ADMIN')` para RBAC. Endpoint `GET /api/v1/me` como smoke do fluxo.
- Páginas web (portando do `docs/claude-design`):
  - `/login` ← `HifiV2Login` (split 1.15fr/1fr, brand presence à esquerda, card SSO à direita com Button secondary lg Google + GitHub).
  - `app/(authed)/layout.tsx` ← `V2Topbar` (logo + workspace + nav + search placeholder + Avatar dropdown com theme switcher + logout).
  - `/` (home autenticada minimal F1): saudação Instrument Serif "Bem-vindo, {name}" + placeholder "Em breve, sua primeira nota". F2 substitui pelo `HifiV2Upload`.
- i18n: namespaces `login`, `topbar`, `auth.errors` em `messages/pt-BR.json`. Tudo via `t()`.
- Logs: token nunca logado; email mascarado em logs de erro de auth.
- Env novas: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAILS`. README ganha seção "Auth setup local".
- Testes:
  - Unit Nest: `JwtStrategy.validate` (válido/expirado/user inexistente), `JwtAuthGuard` + `@CurrentUser()` em rota stub, `RolesGuard`.
  - Unit Next: callbacks `signIn` (cria/atualiza, promove ADMIN), `jwt`, middleware (redirect).
  - E2E Playwright: login via Credentials Provider de teste, redirect pra `/`, fetch `/api/v1/me` retorna USER, logout volta pra `/login`.
- Risco aberto registrado: NextAuth v4 JWT pode usar JWE (não JWS) — primeira task da implementação faz prova de conceito da decodificação no Nest; fallback documentado é trocar pra Database session.

## F2 — OCR (upload → vision → ver texto)

**Spec a escrever:** `2026-05-07-fase-2-ocr.md`

Escopo:

- Schema Prisma: `Document` (id, userId, filename, mime, size, storagePath, status, summary jsonb, extractedText, timestamps), `onDelete: Cascade` no userId.
- Módulo `documents` no Nest: criar, listar (filtro `userId` obrigatório), buscar por id (com ownership check).
- Módulo `ocr` separado: `OcrService` com OpenAI vision, system prompt mencionando campos BR (CNPJ emitente, valor total, data emissão, chave NF-e 44 dígitos, CFOP), retorna `summary` estruturado + `extractedText`.
- `StorageService` abstrato com implementação `RailwayVolumeStorage` — interface pronta para swap futuro com R2.
- Endpoint upload: validação magic bytes (JPG/PNG/PDF), max 10 MB, sanitização de nome, path com UUID, throttle 5/min upload + 3/min OCR.
- Endpoint signed URL: TTL 15 min, autenticado, ownership check.
- Pipeline ponta-a-ponta: upload → save volume → vision → persistir summary+text → retorna documento.
- Web: feature `document-upload` com hook `useDocumentUpload` (progress, sucesso, erro), página `/documents/[id]` mostra texto extraído.
- i18n de todas as strings novas.
- Testes: unit do `OcrService` (mock OpenAI), integração do endpoint upload, E2E upload + ver texto.
- `samples/` com 1-2 invoices genéricas para dev local (BR completo fica para F5).

## F3 — Chat (function calling)

**Spec a escrever:** `2026-05-07-fase-3-chat.md`

Escopo:

- Schema Prisma: `ChatSession` e `ChatMessage` (vinculados a userId+documentId, cascade), papéis (`user`, `assistant`, `tool`), conteúdo, timestamps.
- Módulo `chat` no Nest, separado de `ocr`.
- `ChatService` com SDK OpenAI direto (sem LangChain): function calling com tool `get_full_document(id)` que devolve `extractedText` do banco — só após ownership check.
- System prompt anti-injection: conteúdo de documento entre delimitadores XML, instrução explícita de tratar conteúdo como dado, nunca como comando.
- Endpoint chat: throttle 15/min, recebe sessionId + mensagem, retorna resposta. Streaming sim/não fica para spec da fase.
- Web: feature `chat` com `useChatStream`, integrada na página `/documents/[id]`, mensagens persistidas e renderizadas.
- Logs sem conteúdo de documento nem token.
- Testes: unit do ChatService (mock OpenAI, valida chamada da tool e ownership), integração do endpoint, E2E chat sobre documento.

## F4 — Listagem + Download

**Spec a escrever:** `2026-05-07-fase-4-lista-download.md`

Escopo:

- Web: página `/documents` com listagem do usuário, paginação simples, link para detalhes.
- Endpoint download: gera artefato combinando documento original + texto extraído + transcript do chat. Formato (PDF único vs ZIP com original + .txt + chat.md) fica para spec da fase.
- Signed URL para download (TTL 15 min).
- Web: botão de download com feedback de progresso.
- Testes: integração da geração, E2E lista → clique → download.

## F5 — Finalização

**Spec a escrever:** `2026-05-07-fase-5-finalizacao.md`

Escopo:

- `samples/` definitiva: 3-5 NF-e anonimizadas, 2-3 NFS-e, 1-2 boletos, templates DANFE.
- Página estática de privacy policy (LGPD).
- Cascade delete validado end-to-end (deletar usuário → some tudo, inclusive arquivos do volume).
- README final: setup local, variáveis, comandos de teste/E2E, link do app deployado.
- Suite Playwright cobrindo as 5 jornadas principais (login, upload, ver, chat, download).
- Deploy final + smoke test em produção.
- Checklist contra os entregáveis obrigatórios da spec Paggo (repo, instruções, link deploy).
- História de commits com conventional commits + squash and merge confirmados.

---

## Próximos passos imediatos

- F0 já em execução pelo plano `2026-05-07-monorepo-bootstrap.md`.
- Próxima sessão dedicada: escrever a spec da **F0.5 — Skeleton** (`2026-05-07-fase-0.5-skeleton.md`).
- Em seguida, spec da **F1 — Auth** (`2026-05-07-fase-1-auth.md`) já desenhada nesta sessão.

Implementação de cada fase só começa depois da respectiva spec aprovada.
