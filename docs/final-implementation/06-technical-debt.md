# 6. Débito Técnico

> Pontos de arquitetura, código e infraestrutura identificados na revisão técnica. **Não são bugs críticos** — não impedem o funcionamento — mas devem ser endereçados para escalabilidade e manutenibilidade.

---

## Backend

### BT-01: `pdfToImage` processa apenas a primeira página

**Impacto:** Perda silenciosa de dados em PDFs multi-página (DANFE com anexo, boleto+carnê).  
**Arquivo:** `apps/api/src/ocr/helpers/pdf-to-image.ts`  
**Sugestão:** Extrair todas as páginas e processar como array, ou concatenar verticalmente.

---

### BT-02: Streaming de chat é "fake"

**Impacto:** Controller espera resposta inteira do LLM antes de enviar ao cliente. Latência percebida alta.  
**Arquivo:** `apps/api/src/chat/chat.controller.ts`  
**Sugestão:** Implementar streaming real com `AsyncIterable` no `ConversationEngine` e SSE no controller.

---

### BT-03: Storage providers `@Injectable` mas instanciados com `new`

**Impacto:** Quebra lifecycle hooks do Nest (onModuleInit, onModuleDestroy).  
**Arquivo:** `apps/api/src/storage/storage.module.ts`  
**Sugestão:** Registrar providers no Nest module normalmente ou remover `@Injectable`.

---

### BT-04: `ChatModule` instancia provider com `new` + lógica no factory

**Impacto:** Mesmo que BT-03. Parsing de config inline quebra SRP.  
**Arquivo:** `apps/api/src/chat/chat.module.ts`  
**Sugestão:** Criar `LlmProviderFactory` injetável.

---

### BT-05: `AppModule` acessa `process.env` diretamente

**Impacto:** Inconsistência com `ConfigService`. `NODE_ENV` não é substituível em testes.  
**Arquivo:** `apps/api/src/app.module.ts`  
**Sugestão:** Usar `ConfigService` em factories condicionais.

---

### BT-06: `LlmConfigController` acessa `process.env` diretamente

**Impacto:** Controller de domínio com dependência de infraestrutura.  
**Arquivo:** `apps/api/src/ai-runtime/llm-config.controller.ts`  
**Sugestão:** Injetar `ConfigService`.

---

### BT-07: Cache do `LlmConfigService` sem limite de tamanho

**Impacto:** Crescimento ilimitado de `Map` se keys inválidas forem consultadas.  
**Arquivo:** `apps/api/src/ai-runtime/llm-config.service.ts`  
**Sugestão:** Adicionar TTL ou usar `lru-cache`.

---

### BT-08: `ChatService.loadHistory` ineficiente

**Impacto:** Carrega mensagens em `desc`, faz `reverse()` O(n), depois `findIndex` O(n).  
**Arquivo:** `apps/api/src/chat/chat.service.ts`  
**Sugestão:** Query Prisma com `asc` e `skip` calculado.

---

### BT-09: Upload com rollback manual incompleto

**Impacto:** Se `storage.put` OK mas `document.update` falha, arquivo fica órfão no storage.  
**Arquivo:** `apps/api/src/documents/documents.service.ts`  
**Sugestão:** Transaction compensatória (cleanup async).

---

### BT-10: `signFileUrl` retorna path relativo

**Impacto:** Incompleto se houver CDN ou domínio diferente.  
**Arquivo:** `apps/api/src/documents/documents.service.ts`  
**Sugestão:** Adicionar `BASE_URL` ao path.

---

### BT-11: `health.controller.ts` não verifica Redis nem Storage

**Impacto:** Healthcheck cego a falhas de dependências críticas.  
**Arquivo:** `apps/api/src/health/health.controller.ts`  
**Sugestão:** Adicionar `ocrQueue.client.ping()` e `storage.exists()`.

---

### BT-12: `MockOcrProvider` usa `setTimeout` fixo de 800ms

**Impacto:** Testes e dev mais lentos que necessário.  
**Arquivo:** `apps/api/src/ocr/providers/mock-ocr.provider.ts`  
**Sugestão:** Default 0ms, configurável via env.

---

### BT-13: Type safety comprometida com `as never` / `as any`

**Impacto:** Máscara de problemas de tipagem. Dificulta refatorações.  
**Arquivos:** Múltiplos (`documents.service.ts`, `ai-runtime.service.ts`, `chat.service.ts`)  
**Sugestão:** Modelar tipos Prisma Json com Zod schemas e usar type guards.

---

## Frontend

### BT-14: Rate-limit em memória (não escalável)

**Impacto:** `Map` em memória não funciona com múltiplos containers do Next.js.  
**Arquivo:** `apps/web/lib/rate-limit.ts`  
**Sugestão:** Migrar para Redis/Upstash Ratelimit.

---

### BT-15: Dupla verificação de auth (middleware + layout)

**Impacto:** Chamada SSR desnecessária de `getServerSession`.  
**Arquivo:** `apps/web/app/(authed)/layout.tsx`  
**Sugestão:** Remover `getServerSession` do layout, confiar no middleware.

---

### BT-16: SSR auto-proxy em `documents/page.tsx`

**Impacto:** Página bate em si mesma via loopback, adiciona latência.  
**Arquivo:** `apps/web/app/(authed)/documents/page.tsx`  
**Sugestão:** Usar `internalFetch` para chamar API NestJS diretamente.

---

### BT-17: `useWorkspaceChat` merge por conteúdo pode duplicar

**Impacto:** Mensagens idênticas do usuário podem ser descartadas.  
**Arquivo:** `apps/web/components/features/chat/use-workspace-chat.ts`  
**Sugestão:** Usar `id` único para matching.

---

### BT-18: `ChatPanel` usa `<input>` ao invés de `<textarea>`

**Impacto:** Impede quebras de linha (Shift+Enter).  
**Arquivo:** `apps/web/components/features/chat/chat-panel.tsx`  
**Sugestão:** Substituir por `<textarea autoResize>`.

---

### BT-19: Scroll forçado em toda mensagem

**Impacto:** Rola para o bottom mesmo quando usuário lê mensagens antigas.  
**Arquivo:** `apps/web/components/features/chat/chat-panel.tsx`  
**Sugestão:** Verificar proximidade do bottom antes de scroll.

---

### BT-20: Counter global em `useDocumentUpload`

**Impacto:** IDs de upload podem colidir entre instâncias de hook.  
**Arquivo:** `apps/web/components/features/document-upload/use-document-upload.ts`  
**Sugestão:** Usar `crypto.randomUUID()`.

---

### BT-21: `login.tsx` onSubmit frágil

**Impacto:** Race condition com csrfToken.  
**Arquivo:** `apps/web/components/features/login/login.tsx`  
**Sugestão:** Refatorar para handler mais previsível.

---

### BT-22: `ThemeToggle` hydration mismatch risk

**Impacto:** Layout shift (botão some e reaparece).  
**Arquivo:** `apps/web/components/layout/theme-toggle.tsx`  
**Sugestão:** Renderizar com estado padrão no SSR.

---

## Testes

### BT-23: Admin/metrics sem testes

**Impacto:** Sem cobertura de regressão.  
**Arquivo:** `apps/api/src/admin/metrics/`  
**Sugestão:** Adicionar specs para controller e service.

---

### BT-24: Storage service sem teste unitário

**Impacto:** Apenas providers testados, não a abstração.  
**Arquivo:** `apps/api/src/storage/storage.service.ts`  
**Sugestão:** Mockar providers e testar lógica de abstração.

---

### BT-25: Hooks/componentes de domínio sem teste

**Impacto:** `use-documents-list`, `document-detail`, `benchmark-page`, etc.  
**Arquivos:** `apps/web/components/features/`  
**Sugestão:** Adicionar testes com MSW para interceptar fetch.

---

## Infraestrutura

### BT-26: Sem preview deploys por PR

**Impacto:** Revisão de PR sem ambiente de preview.  
**Sugestão:** Configurar Railway ou Vercel para preview deploys.

---

### BT-27: Sem backup automatizado do Postgres

**Impacto:** Risco de perda de dados.  
**Sugestão:** Configurar backups diários no Railway.

---

## Notas

- Este documento deve ser revisado a cada sprint.
- Itens marcados como "débito técnico" são **deliberadamente** deixados para depois do core.
- **Prioridade de endereçamento:** BT-01, BT-02, BT-09, BT-14, BT-18, BT-23.

---

_Próximo: [Features Futuras](./07-future-features.md)_
