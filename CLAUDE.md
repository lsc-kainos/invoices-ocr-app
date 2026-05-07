# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status do repositório

Greenfield. No momento desta escrita só existe a spec em `docs/paggo-ocr-case-spec.md` — nenhum código foi escrito ainda. **A spec é a fonte de verdade** para toda decisão de stack, estrutura e arquitetura listada abaixo. Antes de divergir de qualquer ponto dela, confirmar com o usuário.

## Contexto do projeto

Case técnico da Paggo (fintech BR que serve construtoras/incorporadoras). Objetivo: web app que faz upload de invoices, extrai texto via OCR e permite chat com LLM sobre o conteúdo extraído. Critério da empresa: **protótipo funcional > tempo gasto** — features críticas primeiro, polimento depois.

## Stack e estrutura planejada

Monorepo com `npm workspaces` + Turborepo:

```
apps/web              # Next.js (App Router) — frontend
apps/api              # NestJS — backend
packages/shared-types # DTOs compartilhados entre web e api
samples/              # invoices de teste (NF-e, NFS-e, boletos BR)
```

- **Frontend:** Next.js + shadcn/ui + Tailwind + NextAuth (Google + GitHub) + next-themes + next-intl (pt-BR ativo, en-US no backlog)
- **Backend:** NestJS + Prisma + class-validator + @nestjs/throttler + helmet
- **DB/Storage:** PostgreSQL + Railway Volumes (montado só na API; frontend acessa via signed URLs com expiração de 15 min)
- **IA:** OpenAI GPT-4o (vision **e** chat) — single provider intencional
- **Deploy:** tudo no Railway (Vercel é recomendação da Paggo, não requisito — decisão consciente de não usar)
- **Testes:** Jest (unit/integ) + Playwright (E2E)
- **Tooling dia-0:** ESLint + Prettier + Husky + lint-staged + commitlint (conventional commits) + GitHub Actions

## Decisões arquiteturais que precisam ser respeitadas

Estas decisões já foram tomadas com justificativa na spec. **Não reverter sem discutir** — tem trade-off documentado por trás.

### OpenAI único para OCR + LLM (não Google Vision + LLM separada)

GPT-4o aceita imagem direto no prompt. Uma SDK, uma chave, um billing. Não introduzir Google Vision, Tesseract, AWS Textract etc. sem confirmar.

### SDK direto da OpenAI, não LangChain

Function calling simples (`get_full_document(id)`) com SDK nativo. LangChain é overhead para o escopo. Se for preciso abstrair multi-provider, fazer interface própria leve.

### Function calling (sumário + texto sob demanda), não RAG/pgvector

Cada documento gera resumo estruturado no banco. Chat recebe os resumos e pode chamar tool `get_full_document(id)` para detalhe. RAG com pgvector está no backlog, **não no core**.

### Storage no Railway Volume, não R2/S3

Decisão pragmática para case. **Mas** abstrair via storage service no Nest desde o começo, para troca trivial por R2 depois sem mexer em domínio.

### Auth: NextAuth com Google + GitHub apenas

Sem email/senha (evita reset, validação, captcha). Adicionar provider é trivial; remover esses dois não é. Decisão de localização (Next ou Nest) é livre pela spec — atualmente planejada no Next.

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

Separados por responsabilidade: `auth`, `users`, `ocr`, `documents`, `chat`. **`chat` é separado de `ocr` de propósito** — ciclos de evolução distintos.

### i18n desde o dia 0 (mesmo com só pt-BR ativo)

Toda string de UI vai por `t('key')`, mesmo que só tenha `messages/pt-BR.json` por enquanto. Não hardcodar texto em componentes.

### Squash and merge, conventional commits

Histórico linear na `main`. PRs descritivos.

## Restrições de segurança que NÃO podem ser ignoradas

Estas não são "boas práticas" genéricas — são exigências do escopo. Aplicar sempre, mesmo em código de exemplo:

- **Toda query Prisma filtra por `userId`.** Nunca buscar documento, mensagem ou metadado sem ownership check. Guards no Nest + filtro explícito no `where`.
- **Validação de upload por magic bytes**, não só extensão. Aceitar JPG, PNG, PDF. Máx 10 MB.
- **Volume nunca exposto direto.** Cliente recebe signed URL da API com expiração ≤ 15 min.
- **Rate limits via `@nestjs/throttler`:** upload 5/min, chat 15/min, OCR 3/min, auth 5/min por IP. Configuráveis via env.
- **Prompt injection:** conteúdo extraído de documento entra no prompt como **dado** entre delimitadores XML, nunca como instrução. System prompt restritivo.
- **CORS sem wildcard em produção.** Lista via `ALLOWED_ORIGINS`.
- **LGPD — `onDelete: Cascade`** em tudo que pertence ao usuário (documentos, mensagens, metadados, arquivos no volume). Deletar usuário = apagar tudo.
- **Logs sem dados sensíveis** — sem token, sem conteúdo de documento.

## Datasets de teste

Estratégia em duas camadas — **a brasileira pesa mais na avaliação** porque é o domínio da Paggo:

1. **Genérico** (validação rápida de pipeline): Kaggle "High Quality Invoice Images for OCR", SROIE 2019, `mychen76/invoices-and-receipts_ocr_v1` no HF.
2. **Brasileiro** (foco real): 3–5 NF-e anonimizadas, 2–3 NFS-e, 1–2 boletos, templates DANFE. Pasta `samples/`.

System prompt do extractor **deve mencionar campos brasileiros explicitamente**: CNPJ emitente, valor total, data emissão, chave NF-e (44 dígitos), CFOP.

## Cobertura de testes

**Não perseguir 80% de coverage global no core.** Foco: **100% nos fluxos críticos**, com peso no backend:

- Pipeline OCR (upload → vision → persistência)
- Integração LLM (chat com function calling)
- Auth/RBAC + ownership checks
- Validação de DTOs
- Endpoints expostos (testes de integração)
- E2E Playwright das jornadas principais (login → upload → visualizar → chat → download)

Coverage global de 80% está no backlog para depois do core.

## Comandos

Ainda não há `package.json`. Quando o monorepo for inicializado, os comandos canônicos serão (Turborepo):

```bash
npm install                    # instala tudo do workspace
npm run dev                    # roda apps/web e apps/api em paralelo
npm run dev --workspace=web    # só o frontend
npm run dev --workspace=api    # só o backend
npm run lint
npm run typecheck
npm run test                   # Jest em todos os workspaces
npm run test:e2e               # Playwright (apps/web)
npm run build
```

Atualizar esta seção assim que `package.json` e `turbo.json` existirem com os scripts reais (incluindo como rodar **um único teste** — provavelmente `npm test -- <padrão>` para Jest e `npx playwright test <arquivo>` para E2E).

## MCP servers habilitados

`.claude/settings.local.json` habilita o MCP `shadcn`. Use as ferramentas `mcp__shadcn__*` ao adicionar/auditar componentes shadcn — preferível a buscar manualmente na web.

## Backlog (NÃO implementar antes do core)

A spec lista explicitamente como pós-core: painel de admin, R2, RAG/pgvector, multi-provider LLM, email transacional, en-US, 80% coverage, Atomic Design, observabilidade (logs estruturados/Prometheus/tracing), cache de LLM, versionamento de prompts, 2FA, SSO, audit log, anonimização, banner de consentimento granular, preview deploys, backup/DR, multi-região.

Se o usuário pedir uma dessas antes do core estar funcional, **confirmar a priorização** — a spec é explícita que features críticas vêm primeiro.
