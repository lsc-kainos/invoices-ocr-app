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

## F0 — Setup e Deploy hello-world

**Spec a escrever:** `2026-05-07-fase-0-setup.md`

Escopo:
- Monorepo `npm workspaces` + Turborepo, layout `apps/web`, `apps/api`, `packages/shared-types`, `samples/`.
- Tooling dia 0: ESLint, Prettier, Husky, lint-staged, commitlint (conventional commits), `.editorconfig`.
- GitHub Actions: lint, typecheck, test, build em PRs.
- Skeleton Next.js (App Router) + Tailwind + shadcn init + paleta OKLCH cobre/conhaque base no `globals.css` + next-themes + next-intl com `messages/pt-BR.json` funcional.
- Skeleton NestJS + helmet + class-validator + `@nestjs/throttler` (config base).
- Prisma: schema mínimo só com `User` placeholder.
- Postgres no Railway, volume montado na api, `.env.example` no repo, `.env` no `.gitignore`.
- Deploy Railway funcional: web e api no ar, banco conectado, healthcheck OK.
- README inicial com setup local.
- Página `/` no web e `/health` no api só para provar que está tudo de pé.

## F1 — Auth

**Spec a escrever:** `2026-05-07-fase-1-auth.md`

Escopo:
- Decisão arquitetural: onde mora a sessão (NextAuth no web e Nest valida via JWT/header? Cookie compartilhado? Proxy?). Spec resolve explicitamente.
- NextAuth com Google + GitHub, `NEXTAUTH_SECRET` forte, cookies httpOnly+secure, expiry 7 dias com renovação por atividade.
- Modelo `User` completo no Prisma: id, email, name, avatar, role (`USER|ADMIN`), timestamps, `onDelete: Cascade` preparado para entidades futuras.
- Validação de sessão no Nest: guard global, decorator `@CurrentUser()`, RBAC `@Roles('ADMIN')`.
- Páginas web: `/login` (botões Google + GitHub), `/dashboard` protegida vazia, redirect funcional.
- Throttler de auth: 5 req/min por IP.
- Tema dark default aplicado, switcher claro/escuro/sistema funcional, todas as strings via `t()`.
- Testes: integração Nest (rota protegida bloqueia/libera), E2E Playwright com mock OAuth (login → /dashboard).
- CORS restritivo via `ALLOWED_ORIGINS`.

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

Após este plano-mestre ser aprovado, abrir sessão dedicada para escrever **a spec da F0** (`2026-05-07-fase-0-setup.md`). Implementação só começa depois da spec da F0 estar aprovada.
