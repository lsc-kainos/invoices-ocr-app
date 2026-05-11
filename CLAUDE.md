# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status do repositório

**Core funcional.** As fases F0 (monorepo bootstrap) até F4 (listagem + download) estão implementadas e operacionais. Além do core, foram entregues funcionalidades do backlog: painel de admin, benchmark de OCR, gerenciamento de configs LLM, fila distribuída (BullMQ + Redis), storage dual (Railway Volume + Cloudflare R2), verificação e edição de documentos, e rejeição automática de documentos fora do escopo.

A **spec original** em `docs/paggo-ocr-case-spec.md` continua sendo a fonte de verdade para decisões de stack, estrutura e arquitetura do **core**. Funcionalidades adicionadas após a spec base (admin, benchmark, ai-runtime) seguem as convenções do projeto mas podem ser tratadas como evoluções — confirmar com o usuário antes de remover ou arquitetar alterações profundas nelas.

## Contexto do projeto

Case técnico da Paggo (fintech BR que serve construtoras/incorporadoras). Objetivo: web app que faz upload de invoices, extrai texto via OCR e permite chat com LLM sobre o conteúdo extraído. Critério da empresa: **protótipo funcional > tempo gasto** — features críticas primeiro, polimento depois.

## Stack e estrutura

Monorepo com `npm workspaces` + Turborepo:

```
apps/web              # Next.js 16 (App Router) — frontend
apps/api              # NestJS 11 — backend
packages/shared-types # DTOs compartilhados entre web e api
samples/              # invoices de teste (NF-e, NFS-e, boletos BR, dataset rotulado)
```

- **Frontend:** Next.js + shadcn/ui + Tailwind v4 + NextAuth (Google + GitHub) + next-themes + next-intl (pt-BR ativo, en-US no backlog)
- **Backend:** NestJS + Prisma 6 + class-validator + @nestjs/throttler + helmet + BullMQ + Redis
- **DB/Storage:** PostgreSQL + Railway Volumes (dev/test) / Cloudflare R2 (prod)
- **Fila:** BullMQ + Redis para OCR jobs (substituiu `@nestjs/event-emitter` da spec F2)
- **IA:** OpenAI GPT-4o (vision + chat) via `openai` SDK e `ai` SDK (Vercel AI SDK) — single provider intencional
- **Deploy:** Railway (web + api + Postgres + Redis + Volume)
- **Testes:** Jest (API, 52+ specs) + Vitest + Testing Library (Web, 28+ testes) + Playwright (E2E)
- **Tooling dia-0:** ESLint + Prettier + Husky + lint-staged + commitlint (conventional commits) + GitHub Actions

## Decisões arquiteturais que precisam ser respeitadas

### OpenAI único para OCR + LLM (não Google Vision + LLM separada)

GPT-4o aceita imagem direto no prompt. Uma SDK, uma chave, um billing. Não introduzir Google Vision, Tesseract, AWS Textract etc. sem confirmar.

### SDK direto da OpenAI + Vercel AI SDK, não LangChain

Function calling simples (`get_full_document(id)`) com SDK nativo e `ai` SDK para streaming. LangChain é overhead para o escopo. Se for precisar abstrair multi-provider, a interface própria leve já existe em `apps/api/src/chat/providers/`.

### Function calling (sumário + texto sob demanda), não RAG/pgvector

Cada documento gera resumo estruturado no banco. Chat recebe os resumos e pode chamar tool `get_full_document(id)` para detalhe. RAG com pgvector está no backlog, **não no core**.

### Storage dual: Railway Volume (dev/test) + Cloudflare R2 (prod)

A abstração `StorageService` com token `STORAGE_SERVICE` permite swap entre `RailwayVolumeProvider` e `CloudflareR2Provider` via env `STORAGE_DRIVER=volume|r2`. Em dev/test usa volume local; em prod pode usar R2.

### Fila distribuída BullMQ + Redis para OCR

A F2 original usava `@nestjs/event-emitter` in-process. A implementação evoluiu para BullMQ + Redis para processamento OCR assíncrono, com retry automático e observabilidade via Bull Board (admin). Isso permite múltiplas réplicas da API sem perder jobs.

### Auth: NextAuth com Google + GitHub + JWT compartilhado

Sem email/senha. O web faz upsert do usuário via Prisma direto no `signIn` callback. O Nest valida o JWT com `NEXTAUTH_SECRET` compartilhado via `passport-jwt`. S2S entre web e api usa `INTERNAL_SERVICE_TOKEN` para endpoints internos (ex: sync de usuário).

### shadcn/ui (componentes copiados), não MUI/Chakra

Componentes ficam em `apps/web/components/ui/`, não em `node_modules`. MCP server `shadcn` está habilitado em `.claude/settings.local.json` para auxiliar.

### Tema customizado Paggo (preto + cobre/conhaque)

Paleta OKLCH definida na spec, dark mode default. Light mode mantém família. Fica em `apps/web/app/globals.css`. **Não alterar paleta sem confirmar** — é parte da identidade do projeto.

### Estrutura plana de componentes com hooks de domínio (NÃO Atomic Design)

```
components/
├── ui/                              # primitivos shadcn
├── features/<feature>/
│   ├── <feature>.tsx                # apresentação pura
│   └── use-<feature>.ts             # lógica, fetch, estado
└── layout/                          # header, sidebar, providers
```

Cada feature tem seu hook (`useDocumentUpload`, `useChatStream`, etc.). Atomic Design está no backlog — **não introduzir prematuramente**.

### Módulos do NestJS

Separados por responsabilidade: `auth`, `users`, `ocr`, `documents`, `chat`, `download`, `admin/metrics`, `ai-runtime`. `chat` é separado de `ocr` de propósito — ciclos de evolução distintos.

### i18n desde o dia 0 (mesmo com só pt-BR ativo)

Toda string de UI vai por `t('key')`, mesmo que só tenha `messages/pt-BR.json` por enquanto. Não hardcodar texto em componentes.

### Squash and merge, conventional commits

Histórico linear na `main`. PRs descritivos.

## Schema Prisma atual

Modelos principais (em `apps/api/prisma/schema.prisma`):

- `User` — F1 (auth, roles USER/ADMIN)
- `Document` — F2 (upload, OCR, storage, summary, extractedText) + evoluções (documentType, confidence, rejectionReason, verifiedAt, verifiedBy, edits)
- `ChatSession` / `ChatMessage` — F3 (chat persistente workspace + por documento)
- `LlmConfig` — F3.5 (versionamento de prompts/configs LLM)
- `BenchmarkRun` — F2.5 (benchmark de qualidade OCR contra dataset rotulado)
- `DocumentEdit` — F4+ (edições manuais dos campos extraídos, com audit trail)

Status de documento: `QUEUED | OCR_RUNNING | READY | FAILED | REJECTED`. O status `REJECTED` foi adicionado para documentos fora do escopo (ex: selfie, contrato) ou com confiança abaixo do threshold.

## Restrições de segurança que NÃO podem ser ignoradas

- **Toda query Prisma filtra por `userId`.** Nunca buscar documento, mensagem ou metadado sem ownership check. Guards no Nest + filtro explícito no `where`.
- **Validação de upload por magic bytes**, não só extensão. Aceitar JPG, PNG, PDF. Máx 10 MB.
- **Volume/R2 nunca exposto direto.** Cliente recebe signed URL da API com expiração ≤ 15 min.
- **Rate limits via `@nestjs/throttler`:** upload 120/min, chat 60/min, OCR 60/min, download 60/min, benchmark 20/hora por user. Configuráveis via env.
- **Prompt injection:** conteúdo extraído de documento entra no prompt como **dado** entre delimitadores XML, nunca como instrução. System prompt restritivo.
- **CORS sem wildcard em produção.** Lista via `ALLOWED_ORIGINS`.
- **LGPD — `onDelete: Cascade`** em tudo que pertence ao usuário (documentos, mensagens, metadados, arquivos no volume). Deletar usuário = apagar tudo.
- **Logs sem dados sensíveis** — sem token, sem conteúdo de documento.
- **S2S `INTERNAL_SERVICE_TOKEN`** — endpoints internos do Nest (ex: sync de usuário) exigem header `X-Internal-Service-Token` validado por `InternalServiceGuard`.

## Datasets de teste

Estratégia em duas camadas:

1. **Genérico** (validação rápida de pipeline): Kaggle invoice dataset, SROIE 2019, `mychen76/invoices-and-receipts_ocr_v1` no HF. Pasta `samples/invoice-dataset/`.
2. **Brasileiro** (foco real): NF-e, NFS-e, boletos em `samples/`.

System prompt do extractor **deve mencionar campos brasileiros explicitamente**: CNPJ emitente, valor total, data emissão, chave NF-e (44 dígitos), CFOP.

## Cobertura de testes

**Não perseguir 80% de coverage global no core.** Foco: **100% nos fluxos críticos**, com peso no backend:

- Pipeline OCR (upload → vision → persistência) — coberto por specs do `OcrService`, `ExtractorService`, `DocumentsService`
- Integração LLM (chat com function calling) — coberto por specs do `ChatService`, providers, tools
- Auth/RBAC + ownership checks — coberto por specs de guards, strategies, decorators
- Validação de DTOs — coberto por specs de env schema e DTOs
- Endpoints expostos (testes de integração) — E2E Jest no Nest
- E2E Playwright das jornadas principais (login → upload → visualizar → chat → download)

Coverage global de 80% está no backlog para depois do core.

## Comandos

```bash
npm install                    # instala tudo do workspace
npm run dev                    # roda apps/web e apps/api em paralelo
npm run dev --workspace=web    # só o frontend
npm run dev --workspace=api    # só o backend
npm run lint
npm run typecheck
npm run test                   # Jest (api) + Vitest (web)
npm run test:e2e               # Playwright (apps/web)
npm run build
npm run db:setup               # sobe Postgres, roda migrate + seed
npm run db:studio              # Prisma Studio
npm run format
```

Para rodar **um único teste**:

- API (Jest): `cd apps/api && npx jest <padrão>`
- Web (Vitest): `cd apps/web && npx vitest run <padrão>`
- E2E (Playwright): `cd apps/web && npx playwright test <arquivo>`

## MCP servers habilitados

`.claude/settings.local.json` habilita o MCP `shadcn`. Use as ferramentas `mcp__shadcn__*` ao adicionar/auditar componentes shadcn — preferível a buscar manualmente na web.

## Funcionalidades já implementadas (não tratar como backlog)

As seguintes features listadas no backlog da spec original já foram implementadas:

- **Painel de admin** (`/admin`): métricas de uso, benchmark de OCR, gerenciamento de configs LLM — acessível apenas a `ADMIN`
- **Fila distribuída**: BullMQ + Redis para OCR jobs com retry, observabilidade Bull Board
- **Storage Cloudflare R2**: provider alternativo ao Railway Volume, toggle via env
- **Versionamento de prompts**: `LlmConfig` com versionamento e ativação de configs LLM
- **Benchmark OCR**: comparação de extração contra dataset rotulado com métricas de F1/precision/recall
- **Document verification**: campos `confidence`, `verifiedAt`, `verifiedBy` no Document
- **Document edits**: edição manual de campos extraídos com audit trail (`DocumentEdit`)
- **Rejeição automática**: status `REJECTED` para documentos fora de escopo ou confiança baixa
- **S2S auth**: `INTERNAL_SERVICE_TOKEN` para comunicação segura web → api

## Backlog (NÃO implementar antes de confirmar prioridade)

A spec lista explicitamente como pós-core: RAG/pgvector, multi-provider LLM, email transacional, en-US, 80% coverage global, Atomic Design, observabilidade avançada (logs estruturados/Prometheus/tracing), cache de LLM, 2FA, SSO, audit log completo, anonimização, banner de consentimento granular, preview deploys, backup/DR, multi-região.

Se o usuário pedir uma dessas antes do core estar funcional, **confirmar a priorização** — a spec é explícita que features críticas vêm primeiro.
