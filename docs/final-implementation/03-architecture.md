# 3. Arquitetura da Solução

> Visão geral da arquitetura, padrões e fluxos de dados. Baseada na implementação real.

---

## 3.1 Visão Geral

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Client    │────▶│  Next.js    │────▶│   NestJS API    │
│  (Browser)  │◀────│   (Web)     │◀────│    (API)        │
└─────────────┘     └─────────────┘     └─────────────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                   ┌──────────┐         ┌──────────┐          ┌──────────┐
                   │ PostgreSQL│         │  Redis   │          │ Storage  │
                   │ (Prisma) │         │ (BullMQ) │          │(Vol/R2)  │
                   └──────────┘         └──────────┘          └──────────┘
                         ▼
                   ┌──────────┐
                   │ OpenAI   │
                   │ (GPT-4o) │
                   └──────────┘
```

---

## 3.2 Autenticação

### Arquitetura: Stateless com JWT

- **NextAuth** gerencia todo o fluxo OAuth (redirect, callback, code → token)
- **Provedores:** Google e GitHub
- **Sessão:** cookie JWE criptografado com `NEXTAUTH_SECRET`
- **Backend:** valida o JWT com a mesma chave via `passport-jwt` (lib `jose`)
- **S2S:** endpoints internos usam `INTERNAL_SERVICE_TOKEN` no header `X-Internal-Service-Token`

### Fluxo

```
Usuário ──▶ NextAuth (OAuth) ──▶ JWT no cookie
                                    │
                                    ▼
                              NestJS API
                              (JwtStrategy)
                                    │
                                    ▼
                              Prisma (upsert user)
```

**Segredo compartilhado:** `NEXTAUTH_SECRET` é a mesma no web e api. Um "secret fingerprint" garante que ambos usam a mesma chave — bug real que ocorreu durante o desenvolvimento e foi corrigido.

---

## 3.3 Frontend (Next.js 16)

### Estrutura de Componentes

```
components/
├── ui/                    # Primitivos shadcn/ui
├── features/<feature>/
│   ├── <feature>.tsx      # Componente de apresentação
│   └── use-<feature>.ts   # Hook com lógica, fetch, estado
└── layout/                # Header, providers
```

**Padrão:** cada feature tem seu hook dedicado.

### Tecnologias

- **shadcn/ui:** componentes copiados (não instalados via npm), customizáveis
- **Tailwind v4:** estilização utilitária
- **next-intl:** i18n desde o dia 0 (pt-BR ativo, en-US no backlog)
- **next-themes:** dark mode default (tema Paggo: preto + cobre/conhaque)
- **Vitest + Testing Library:** testes unitários de componentes e hooks

### Páginas Principais

- `/` — Landing page
- `/login` — Autenticação OAuth
- `/documents` — Listagem de documentos (SSR auto-proxy)
- `/documents/[id]` — Detalhe do documento + chat
- `/chat` — Chat workspace (todos os documentos)
- `/admin` — Painel administrativo com sub-rotas:
  - `/admin/usage` — Métricas de uso acumuladas
  - `/admin/benchmark` — Benchmark OCR
  - `/admin/llm-configs` — Gerenciamento de configs LLM

---

## 3.4 Backend (NestJS 11)

### Módulos

```
src/
├── auth/                  # OAuth, JWT strategy, guards
├── users/                 # CRUD de usuários, roles
├── documents/             # Upload, listagem, detalhe, edição, deduplicação
├── ocr/                   # Pipeline OCR (extração, classificação, deduplicação)
├── chat/                  # Conversação com LLM, function calling
├── download/              # Geração de ZIP com documento + extração
├── admin/
│   ├── metrics/           # Métricas de uso acumuladas
│   └── queues.module.ts   # Bull Board para monitoramento de filas
├── ai-runtime/            # Configuração versionada de prompts LLM
├── storage/               # Abstração de storage (Volume / R2)
├── health/                # Healthchecks
└── ...
```

### Padrões

- **Dependency Injection:** NestJS nativo, providers injetáveis
- **DTOs compartilhados:** `packages/shared-types` garante contrato entre web e api
- **Validação:** class-validator nos DTOs
- **Rate Limiting:** `@nestjs/throttler` em endpoints críticos
- **Segurança:** helmet, CORS restrito, validação de upload por magic bytes

---

## 3.5 Pipeline OCR

```
Upload (JPG/PNG/PDF)
    │
    ▼
Validação (magic bytes, tamanho ≤ 10MB)
    │
    ▼
Storage (Volume local / R2)
    │
    ▼
Fila BullMQ (job assíncrono)
    │
    ▼
OCR Service
    ├── PDF → Imagem (primeira página)
    ├── OpenAI GPT-4o Vision (extração via ExtractorService)
    ├── Zod validation (estruturação via invoiceSummarySchema)
    ├── Classificação (tipo de documento: nf-e, nfs-e, boleto, invoice, receipt)
    ├── Rejeição (confiança baixa ou tipo não suportado)
    ├── Deduplicação semântica (computeSignature + findReadySemanticDuplicate)
    └── Persistência (Document + Summary)
    │
    ▼
Status: READY / FAILED / REJECTED / DUPLICATE
```

**Retry automático:** BullMQ com retry configurável para falhas transientes.

**Deduplicação:**

- **Exata:** `contentHash` (hash do arquivo)
- **Semântica:** `semanticHash` (hash dos campos extraídos: CNPJ, valor, data, chave)

---

## 3.6 Chat com LLM

### Arquitetura

- **Contexto:** resumos estruturados dos documentos são enviados como contexto
- **Function Calling:** tool `get_full_document(id)` para acesso sob demanda ao texto completo
- **Streaming:** SSE implementado no controller, mas **espera resposta inteira antes de enviar** (streaming "fake" — ver débito técnico BT-02)
- **Persistência:** `ChatSession` e `ChatMessage` no PostgreSQL
- **Tool loop:** máximo 3 iterações de tool calls (`CHAT_MAX_TOOL_ITERATIONS`)

### Fluxo

```
Usuário envia mensagem
    │
    ▼
ChatService monta contexto (resumos dos documentos READY do usuário)
    │
    ▼
OpenAI GPT-4o com function calling
    │
    ▼
Se precisar de detalhe ──▶ get_full_document(id)
    │
    ▼
Resposta persistida e retornada (streaming SSE simulado)
```

**RAG/pgvector:** está no backlog.

---

## 3.7 AI Runtime

### `AiRuntimeService`

Serviço dedicado para geração estruturada via LLM:

- Usa **Vercel AI SDK** (`generateObject` do pacote `ai`)
- Recebe `LlmConfigKey` (EXTRACTOR ou CHAT)
- Busca config ativa no banco (`LlmConfig`)
- Valida saída contra **Zod schema**
- Permite overrides de model, prompt e params

```typescript
const result = await aiRuntime.generateObject({
  key: LlmConfigKey.EXTRACTOR,
  schema: invoiceSummarySchema,
  messages: [{ role: 'user', content: imageBase64 }],
});
```

**Benefício:** prompts versionados, testáveis e alteráveis em runtime via admin.

---

## 3.8 Storage

### Abstração

```typescript
interface StorageService {
  put(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}
```

### Providers

- **RailwayVolumeProvider:** dev/test, armazena em disco local com path traversal protection
- **CloudflareR2Provider:** produção, compatível S3

**Toggle:** `STORAGE_DRIVER=volume|r2` no `.env`.

**Injeção:** providers são `@Injectable` e instanciados via factory no `StorageModule`.

**Segurança:** cliente nunca acessa storage diretamente. Recebe signed URL com expiração ≤ 15 min.

---

## 3.9 Fila Distribuída

### BullMQ + Redis

- **Producer:** `DocumentsService` cria job após upload
- **Consumer:** `OcrProcessor` processa OCR assincronamente
- **Observabilidade:** Bull Board (rota `/admin/queues`) para monitoramento
- **Benefício:** múltiplas réplicas da API podem processar jobs sem perda

---

## 3.10 Database (Prisma)

### Modelos Principais

- **User:** autenticação, roles (USER/ADMIN)
- **Document:** upload, OCR, storage, metadados, status, deduplicação
- **ChatSession / ChatMessage:** histórico de conversas
- **LlmConfig:** versionamento de prompts e configs (EXTRACTOR, CHAT)
- **BenchmarkRun:** histórico de benchmarks OCR
- **DocumentEdit:** audit trail de edições manuais

### Campos de Deduplicação

- `contentHash` — hash do arquivo para deduplicação exata
- `semanticHash` — hash dos campos extraídos para deduplicação semântica
- `duplicateOfId` — referência ao documento original
- `possibleDuplicateOfId` — referência a possível duplicata
- `duplicateMatchStrength` — força do match (weak/strong)

### Status de Documento

`QUEUED | OCR_RUNNING | READY | FAILED | REJECTED | DUPLICATE`

**LGPD:** `onDelete: Cascade` em tudo que pertence ao usuário.

---

_Próximo: [Tradeoffs e Decisões](./04-tradeoffs.md)_
