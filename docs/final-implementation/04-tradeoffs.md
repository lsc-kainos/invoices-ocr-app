# 4. Tradeoffs e Decisões

> Escolhas arquiteturais conscientes e seus impactos. Baseadas na implementação real.

---

## 4.1 Fila: EventEmitter → BullMQ + Redis

### Decisão Original

Usar `@nestjs/event-emitter` in-process para OCR. Simples, sem infraestrutura extra.

### Implementação Real

Migração para **BullMQ + Redis** para processamento assíncrono.

**Ganhos:**

- Escalabilidade: múltiplas réplicas processam jobs
- Resiliência: retry automático, dead letter queue
- Observabilidade: Bull Board para monitoramento

**Custos:**

- Infraestrutura extra (Redis)
- Complexidade de configuração
- Latência adicional (job na fila)

**Veredito:** tradeoff válido. A fila foi implementada como melhoria de arquitetura.

---

## 4.2 Storage: Railway Volume → Cloudflare R2

### Decisão Original

Armazenar documentos em volume local (Railway Volume) para simplicidade.

### Implementação Real

Abstração dual: `RailwayVolumeProvider` (dev/test) e `CloudflareR2Provider` (prod).

**Ganhos:**

- Dev/test rápido sem depender de serviço externo
- Produção com storage persistente e escalável
- Swap transparente via variável de ambiente

**Custos:**

- Duas implementações para manter
- Configuração extra de credenciais R2

**Veredito:** tradeoff excelente. Isola ambientes sem complicar o código de produção.

---

## 4.3 OCR: GPT-4o Vision vs. Tesseract/AWS Textract

### Decisão

Usar **OpenAI GPT-4o Vision** para OCR via `ExtractorService`.

**Ganhos:**

- Uma SDK, uma chave, um billing
- Qualidade superior em documentos brasileiros (layout complexo, CNPJ, chaves)
- Saída estruturada nativa (JSON) com Zod validation
- Simples de implementar e manter

**Custos:**

- Custo por requisição maior que Tesseract (gratuito)
- Dependência de provider único
- Latência variável

**Veredito:** tradeoff aceitável para protótipo. "Protótipo funcional > tempo gasto."

---

## 4.4 Chat: Contexto por Registros vs. RAG/pgvector

### Decisão

Enviar resumos estruturados dos documentos como contexto + function calling `get_full_document(id)`.

**Ganhos:**

- Implementação simples, sem infraestrutura de vector database
- Funciona bem para quantidade moderada de documentos
- Controle total sobre o que entra no contexto

**Custos:**

- Maior uso de tokens por requisição
- Não escala para milhares de documentos
- Sem semantic search

**Veredito:** tradeoff deliberado. RAG/pgvector está no backlog.

---

## 4.5 Streaming de Chat: SSE Simulado

### Implementação Real

O controller verifica header `Accept: text/event-stream`, mas **espera a resposta inteira do LLM antes de enviar** ao cliente. O SSE envia tudo de uma vez.

**Ganhos:**

- Interface de streaming mantida (fácil evoluir para real)
- Menor complexidade de implementação

**Custos:**

- Latência percebida alta pelo usuário
- Não aproveita benefícios psicológicos do streaming real

**Veredito:** tradeoff temporário. Streaming real está no backlog (BT-02).

---

## 4.6 Rate Limiting: In-Memory

### Decisão

Usar `@nestjs/throttler` (in-memory) no backend.

**Ganhos:**

- Simples de configurar
- Protege contra abusos básicos

**Custos:**

- Não escala com múltiplos containers

**Veredito:** tradeoff temporário. Para produção real, migrar para Redis.

---

## 4.7 Auth: NextAuth vs. Auth0/Clerk

### Decisão

Usar **NextAuth** com OAuth nativo (Google + GitHub).

**Ganhos:**

- Open source, sem custo de licença
- Controle total sobre o fluxo
- JWT compartilhado entre web e api funciona bem

**Custos:**

- Mais código para manter que soluções managed

**Veredito:** tradeoff adequado para o escopo.

---

## 4.8 Monorepo vs. Repositórios Separados

### Decisão

Monorepo com npm workspaces + Turborepo.

**Ganhos:**

- Shared types sem publicação de pacotes
- Scripts unificados
- CI/CD simplificado

**Custos:**

- Maior complexidade inicial

**Veredito:** tradeoff positivo.

---

## 4.9 shadcn/ui vs. MUI/Chakra

### Decisão

Usar **shadcn/ui** (componentes copiados).

**Ganhos:**

- Controle total sobre o código
- Sem dependência de lib de UI
- Fácil customizar para o tema Paggo

**Custos:**

- Mais código no repositório

**Veredito:** tradeoff positivo.

---

_Próximo: [Incrementos e Melhorias](./05-increments.md)_
