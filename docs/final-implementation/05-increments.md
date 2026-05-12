# 5. Incrementos e Melhorias

> Funcionalidades entregues além do core obrigatório do case. Baseadas na implementação real.

---

## 5.1 Benchmark OCR

Validação mínima da qualidade do fluxo OCR contra dataset rotulado.

- **Comparativo entre runs:** cada execução compara resultados com a verdade ground
- **Métricas:** precision, recall, F1-score
- **Histórico:** `BenchmarkRun` no banco com snapshot do modelo, prompt e params usados
- **Admin:** página `/admin/benchmark` para executar e visualizar resultados

**Valor:** permite ajustar prompts e modelos com dados, não com achismo.

---

## 5.2 Painel Administrativo

Rota `/admin` com acesso restrito a `ADMIN`:

- **Métricas de uso (`/admin/usage`):** documentos por status, acumulados por mês
- **Benchmark OCR (`/admin/benchmark`):** execução e histórico de benchmarks
- **Configs LLM (`/admin/llm-configs`):** CRUD de prompts e parâmetros versionados
- **Fila (`/admin/queues`):** Bull Board para monitoramento de jobs BullMQ

---

## 5.3 Deduplicação de Documentos

Dois níveis de deduplicação implementados:

### Deduplicação Exata

- Baseada em `contentHash` (hash do arquivo)
- Detecta uploads idênticos do mesmo arquivo

### Deduplicação Semântica

- Baseada em `semanticHash` (hash dos campos extraídos: CNPJ, valor, data, chave)
- Detecta documentos logicamente duplicados (ex: mesma NF-e escaneada 2x)
- Força do match: `weak` (possível duplicata) ou `strong` (duplicata confirmada)
- Status `DUPLICATE` no schema

**Valor:** evita processamento e armazenamento redundante.

---

## 5.4 Versionamento de Prompts LLM

Modelo `LlmConfig` no banco:

- **Chaves:** `EXTRACTOR` (OCR) e `CHAT` (conversação)
- **Versionamento:** múltiplas versões por chave, uma ativa
- **Parâmetros:** model, temperature, maxTokens em JSON
- **Alteração em runtime:** admin pode trocar prompt ativo sem deploy

**Valor:** permite A/B test de prompts e rollback rápido.

---

## 5.5 Rejeição Automática de Documentos

Pipeline OCR rejeita documentos automaticamente:

- **Tipo não suportado:** `documentType` fora da lista `['nf-e', 'nfs-e', 'boleto', 'invoice', 'receipt']`
- **Confiança baixa:** `confidence < OCR_REJECT_CONFIDENCE_THRESHOLD` (default 0.6)
- **Status:** `REJECTED` com `rejectionReason`

**Valor:** reduz ruído no sistema e economiza tokens de LLM.

---

## 5.6 Verificação e Edição Manual

- **Verificação:** campos `verifiedAt`, `verifiedBy`, `confidence` no `Document`
- **Edição:** `DocumentEdit` com audit trail (`before`/`after` JSON)
- **Interface:** tela de detalhe permite editar campos extraídos

**Valor:** corrige erros de OCR e mantém rastro de alterações.

---

## 5.7 Compartilhamento de DTOs

Pacote `packages/shared-types` compartilhado entre web e api:

- `DocumentStatus`, `DocumentSummary`, `InvoiceSummary`
- `ChatRole`, `Metrics`
- Garante contrato de API em tempo de compilação

---

## 5.8 Internacionalização (i18n)

- **next-intl** desde o dia 0
- **Idioma ativo:** pt-BR
- **Idioma no backlog:** en-US
- **Todas as strings** passam por `t('key')`, mesmo que só exista pt-BR

**Valor:** facilita expansão futura sem refatoração massiva.

---

## 5.9 Testes End-to-End

**Playwright** para jornadas principais:

- Login → upload → visualizar → chat → download
- Screenshots automáticos em falhas
- Execução via `npm run test:e2e`

---

## 5.10 Zod para Estruturação de Saída LLM

Todos os outputs do LLM são validados com Zod:

- `invoiceSummarySchema` — extração OCR
- `chat` — function calling com tipos seguros
- `ai-runtime` — `generateObject` do Vercel AI SDK usa Zod internamente

**Valor:** evita hallucinations estruturais e garante contrato de dados.

---

## 5.11 Métricas de Uso

Painel `/admin/usage` com:

- Documentos por status (total e por usuário)
- Uploads por mês (acumulado)
- Taxa de sucesso/falha OCR

**Valor:** visibilidade operacional do sistema.

---

## 5.12 S2S Authentication

Endpoints internos do Nest (ex: sync de usuário) exigem:

- Header `X-Internal-Service-Token`
- Validado por `InternalServiceGuard`
- Token compartilhado via `INTERNAL_SERVICE_TOKEN`

**Valor:** segurança na comunicação web → api sem expor endpoints públicos.

---

_Próximo: [Débito Técnico](./06-technical-debt.md)_
