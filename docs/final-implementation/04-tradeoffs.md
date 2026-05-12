# 4. Tradeoffs e Decisões

> Como as decisões arquiteturais foram tomadas: **implementar simples primeiro, refinar conforme tempo permite**. Cada migração representa uma evolução do "mínimo viável" para uma solução mais robusta.

---

## Estratégia Central

A regra de ouro do projeto: **protótipo funcional > tempo gasto**. Começamos sempre com a solução mais simples que entrega valor. Se sobra tempo (ou a dor se torna real), evoluímos.

---

## 4.1 Fila: EventEmitter → BullMQ + Redis

### v0: EventEmitter (in-process)

Inicialmente usamos `@nestjs/event-emitter` para OCR. Zero infraestrutura extra — o evento era disparado no mesmo processo do upload.

```
Upload → DocumentsService.emit('ocr.process') → OcrListener.process()
```

**Por que começou assim:**

- Funcionava para um único container
- Sem dependência de Redis
- Menos código, menos configuração

**Quando a dor apareceu:**

- Se o container reiniciava durante OCR, o job morria
- Sem visibilidade do que estava na fila
- Sem retry automático
- Múltiplas réplicas causavam race conditions

### v1: BullMQ + Redis

Migração para fila distribuída:

```
Upload → ocrQueue.add('process', { documentId }) → OcrProcessor (WorkerHost)
```

**O que ganhou:**

- **Resiliência:** job sobrevive a restart do container
- **Retry automático:** BullMQ reprocessa erros transientes
- **Observabilidade:** Bull Board (`/admin/queues`) mostra jobs pendentes, falhos, ativos
- **Escalabilidade:** múltiplos workers podem processar em paralelo

**O que custou:**

- Infraestrutura extra (Redis)
- Complexidade de configuração
- Latência adicional (job na fila ao invés de imediato)

**Quando migrou:** após F2 (OCR funcional), antes de ir para produção com múltiplas réplicas.

**Veredito:** migração necessária. O EventEmitter foi um ótimo MVP, mas BullMQ é essencial para produção.

---

## 4.2 Storage: Railway Volume → Cloudflare R2

### v0: Railway Volume (filesystem local)

Começamos com Railway Volume — um disco montado no container. Zero configuração de credenciais, funciona imediatamente.

```typescript
// RailwayVolumeProvider
async put(path: string, buffer: Buffer): Promise<void> {
  await fs.writeFile(this.resolveSafe(path), buffer);
}
```

**Por que começou assim:**

- Railway oferece Volume com um clique
- Sem setup de credenciais de cloud
- Dev/test funcionam identicamente

**Quando a dor apareceu:**

- Volume é efêmero em certos cenários de deploy
- Não escala para múltiplas zonas/regiões
- Railway Volume tem limitações de I/O

### v1: Abstração Dual (Volume + R2)

Implementamos `StorageService` como interface com dois providers:

```typescript
// apps/api/src/storage/storage.module.ts
useFactory: (cfg: ConfigService) => {
  const driver = cfg.get<string>('STORAGE_DRIVER') ?? 'volume';
  return driver === 'r2' ? new CloudflareR2Provider(cfg) : new RailwayVolumeProvider(cfg);
};
```

**O que ganhou:**

- **Dev/test:** continua com Volume (rápido, sem credenciais)
- **Produção:** R2 (persistent, escalável, compatível S3)
- **Swap transparente:** mesma linha de código, variável de ambiente diferente

**O que custou:**

- Duas implementações para manter
- Configuração extra de credenciais R2 em produção

**Quando migrou:** após F2 (upload/OCR funcionando), antes do deploy em produção real.

**Veredito:** abstração foi a decisão certa. Isola ambientes sem complicar o código de produção.

---

## 4.3 IA: OpenAI SDK Direto → Vercel AI SDK (OCR)

### v0: OpenAI SDK nativo

O OCR começou chamando diretamente a API da OpenAI:

```typescript
// Conceitual — não é o código atual
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: imageBase64 }],
});
```

**Por que começou assim:**

- SDK da OpenAI é familiar e bem documentado
- Function calling nativo funciona bem
- Zero abstração = controle total

**Quando a dor apareceu:**

- Structured output (JSON válido) era frágil — parsing manual de strings
- Sem schema validation integrado
- Acoplamento forte com API da OpenAI
- Diffícil trocar de provider sem refatorar todo o OCR

### v1: Vercel AI SDK (`generateObject`)

Migração para `ai` SDK (Vercel AI SDK) com Zod:

```typescript
// apps/api/src/ai-runtime/ai-runtime.service.ts
const result = await generateObject({
  model: modelFor(modelId), // ← agnóstico ao provider
  schema: opts.schema, // ← Zod schema
  messages,
  ...params,
});
```

**O que ganhou:**

- **Saída estruturada garantida:** Zod valida antes de retornar
- **Framework-agnóstico:** `modelFor()` pode retornar OpenAI, Anthropic, Google...
- **Menos código boilerplate:** `generateObject` lida com streaming, parsing, retry
- **Prompt versionável:** via `LlmConfig` no banco

**O que custou:**

- Dependência extra (`ai` + `@ai-sdk/openai`)
- Curva de aprendizado da nova API
- Chat ainda usa OpenAI SDK nativo (migração parcial)

**Status atual:**

- **OCR (Extractor):** usa Vercel AI SDK ✅
- **Chat:** ainda usa OpenAI SDK nativo (débito técnico BT-04)

**Quando migrou:** durante F3.1 (AI Runtime), quando implementamos `LlmConfig` e precisávamos de saída estruturada confiável.

**Veredito:** migração valeu a pena para OCR. O chat ainda precisa ser migrado.

---

## 4.4 Chat: Contexto por Registros vs. RAG/pgvector

### Decisão (ainda em v0)

Enviar resumos estruturados dos documentos como contexto + function calling `get_full_document(id)`.

```
Contexto no prompt:
Documento A: { filename: "NF-e-123.pdf", summary: { total: "R$ 1.500", ... } }
Documento B: { filename: "Boleto-456.pdf", summary: { total: "R$ 890", ... } }
```

**Por que não RAG desde o início:**

- RAG exige: embeddings + vector database (pgvector) + chunking + semantic search
- Muito mais infraestrutura e código para um protótipo
- Com < 50 documentos por usuário, enviar resumos é suficiente

**Quando a dor vai aparecer:**

- Usuário com 1000+ documentos → contexto excede limite de tokens
- Precisa de busca semântica ("encontre NF-e do fornecedor X")

**Veredito:** tradeoff deliberado. RAG/pgvector está no backlog como evolução pós-core.

---

## 4.5 Streaming de Chat: SSE "Fake"

### v0: Resposta completa

O controller espera a resposta inteira do LLM antes de enviar ao cliente.

```typescript
// apps/api/src/chat/chat.controller.ts
const result = await this.chat.sendWorkspaceMessage(user.id, sessionId, body.content);
res.write(`data: ${JSON.stringify({ delta: result.content })}\n\n`);
res.write(`data: [DONE]\n\n`);
```

**Por que começou assim:**

- Streaming real com OpenAI SDK exige `AsyncIterable` + SSE
- Mais complexidade de estado e erro
- "Fake streaming" entrega a mesma UX visual (usuário vê texto aparecendo)

**Quando vai migrar:**

- Streaming real reduz latência percebida
- Essencial para respostas longas (evita timeout de 30s)

**Veredito:** tradeoff temporário. Interface SSE mantida, fácil evoluir. Débito técnico BT-02.

---

## 4.6 Rate Limiting: In-Memory

### v0: In-Memory (Throttler do NestJS)

```typescript
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60_000, limit: 600 },
  { name: 'upload', ttl: 60_000, limit: 120 },
  // ...
]),
```

**Por que começou assim:**

- `@nestjs/throttler` funciona out-of-the-box
- Sem infraestrutura extra
- Suficiente para protótipo com poucos usuários

**Limitação:** com múltiplos containers, cada um tem seu próprio contador. Um usuário pode fazer `n × containers` requisições.

**Quando vai migrar:** quando escalar para múltiplas réplicas em produção.

**Veredito:** tradeoff temporário. Para produção real, migrar para Redis/Upstash Ratelimit.

---

## 4.7 Auth: NextAuth vs. Auth0/Clerk

### Decisão (não houve migração)

Usar **NextAuth** com OAuth nativo (Google + GitHub).

**Por que não Auth0/Clerk:**

- Auth0/Clerk tem custo e complexidade de setup
- NextAuth entrega o mesmo valor para o escopo (OAuth + JWT)
- JWT compartilhado entre web e API funciona bem
- Menos vendor lock-in

**O que custou:**

- Mais código para manter (callback de sync, JWT strategy)
- Responsabilidade de segurança do JWT

**Veredito:** tradeoff adequado. Não justifica custo de solução managed em protótipo.

---

## 4.8 Monorepo vs. Repositórios Separados

### Decisão (não houve migração)

Monorepo com npm workspaces + Turborepo.

**Por que monorepo:**

- Shared types (`packages/shared-types`) sem publicação de pacotes
- Scripts unificados (`npm run dev` sobe ambos)
- CI/CD simplificado
- Refatorações cross-repo fáceis

**O que custou:**

- Maior complexidade inicial
- Todos os devs precisam entender o workspace

**Veredito:** tradeoff positivo. A produtividade ganha supera a curva de aprendizado.

---

## 4.9 shadcn/ui vs. MUI/Chakra

### Decisão (não houve migração)

Usar **shadcn/ui** (componentes copiados, não instalados via npm).

**Por que shadcn:**

- Controle total sobre o código dos componentes
- Sem dependência de lib de UI que pode mudar
- Fácil customizar para o tema do produto (preto + cobre/conhaque)
- Funciona com Tailwind v4

**O que custou:**

- Mais código no repositório
- Responsabilidade de manter os componentes

**Veredito:** tradeoff positivo para um projeto com identidade visual própria.

---

## Resumo das Migrações

| Componente       | v0 (MVP)                | v1 (Refinado)       | Gatilho da Migração            |
| ---------------- | ----------------------- | ------------------- | ------------------------------ |
| **Fila**         | EventEmitter in-process | BullMQ + Redis      | Container restart matando jobs |
| **Storage**      | Railway Volume          | Volume + R2 dual    | Volume efêmero em produção     |
| **IA (OCR)**     | OpenAI SDK nativo       | Vercel AI SDK + Zod | Saída estruturada frágil       |
| **IA (Chat)**    | OpenAI SDK nativo       | _Ainda em v0_       | Débito técnico BT-04           |
| **Contexto LLM** | Resumos no prompt       | _Ainda em v0_       | RAG no backlog                 |
| **Streaming**    | SSE "fake"              | _Ainda em v0_       | Débito técnico BT-02           |
| **Rate Limit**   | In-memory               | _Ainda em v0_       | Migra quando escalar réplicas  |

**Lição:** a estratégia de "simples primeiro" funcionou. Cada migração foi motivada por dor real, não por especulação. O que não doeu, ficou em v0.

---

_Próximo: [Incrementos e Melhorias](./05-increments.md)_
