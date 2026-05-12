# 7. Features Futuras

> Roadmap e próximos passos identificados no backlog. **Não implementar antes de confirmar prioridade** com o time de produto.

---

## 7.1 RAG / pgvector

**Contexto:** Atualmente o chat envia resumos estruturados de todos os documentos do usuário no prompt. Isso não escala para milhares de documentos.

**Proposta:**

- Adicionar `pgvector` ao PostgreSQL
- Gerar embeddings dos documentos extraídos
- Busca semântica no chat (top-k relevantes)
- Reduzir uso de tokens e melhorar precisão das respostas

**Status:** backlog pós-core.

---

## 7.2 Multi-Provider LLM

**Contexto:** Atualmente usa apenas OpenAI (GPT-4o). Há risco de vendor lock-in e custo.

**Proposta:**

- Interface `LlmProvider` já existe em `apps/api/src/chat/providers/`
- Adicionar providers: Anthropic Claude, Google Gemini, local (Ollama)
- Fallback automático se um provider falhar
- Seleção por config (`LlmConfig`)

**Status:** backlog.

---

## 7.3 Streaming Real de Chat

**Contexto:** O streaming atual é simulado (BT-02). A resposta inteira é gerada antes de enviar ao cliente.

**Proposta:**

- Implementar `AsyncIterable` no `ConversationEngine`
- SSE real com chunks do LLM
- Melhorar latência percebida

**Status:** débito técnico BT-02.

---

## 7.4 Email Transacional

**Contexto:** Usuário não recebe notificação quando OCR termina.

**Proposta:**

- Integração com SendGrid / Resend
- Notificação de conclusão de OCR
- Alerta de rejeição (documento fora de escopo)
- Resumo semanal de atividade

**Status:** backlog.

---

## 7.5 Integração com WhatsApp

**Contexto:** Usuários no Brasil preferem WhatsApp over email para notificações.

**Proposta:**

- Webhook para receber mensagens
- Bot de respostas sobre documentos processados
- Envio de documentos via WhatsApp Business API

**Status:** backlog.

---

## 7.6 Preview Deploys por PR

**Contexto:** Cada PR precisa ser testado manualmente em ambiente local.

**Proposta:**

- Railway ou Vercel para preview deploys automáticos
- URL única por PR
- Facilita code review e QA

**Status:** débito técnico BT-26.

---

## 7.7 Coverage Global 80%

**Contexto:** Foco atual em 100% dos fluxos críticos. Coverage global está abaixo de 80%.

**Proposta:**

- Cobrir admin/metrics (BT-23)
- Cobrir hooks de domínio no frontend (BT-25)
- Cobrir storage service (BT-24)
- MSW (Mock Service Worker) para testes de integração no frontend

**Status:** backlog pós-core.

---

## 7.8 Atomic Design

**Contexto:** A estrutura atual é plana (`features/<feature>/`).

**Proposta:**

- `atoms/` — botões, inputs
- `molecules/` — cards, form fields
- `organisms/` — headers, modais
- `templates/` — layouts de página
- `pages/` — rotas

**Status:** backlog. Estrutura atual é intencionalmente simples para velocidade.

---

## 7.9 Observabilidade Avançada

**Contexto:** Logs são textuais. Sem métricas estruturadas.

**Proposta:**

- Logs estruturados (JSON) com correlational IDs
- Prometheus + Grafana para métricas
- Distributed tracing (OpenTelemetry)
- Alertas para taxa de erro OCR, latência de chat

**Status:** backlog.

---

## 7.10 Cache de LLM

**Contexto:** Chamadas repetidas ao LLM com mesmo contexto geram custo desnecessário.

**Proposta:**

- Cache de respostas por hash de prompt
- Redis para cache distribuído
- TTL configurável por tipo de operação

**Status:** backlog.

---

## 7.11 2FA / SSO Enterprise

**Contexto:** Auth atual é OAuth social (Google/GitHub).

**Proposta:**

- 2FA via TOTP (Google Authenticator)
- SSO SAML para clientes enterprise
- RBAC mais granular (manager, accountant, etc.)

**Status:** backlog.

---

## 7.12 Anonimização e LGPD Avançada

**Contexto:** LGPD básico implementado (cascade delete, sem dados sensíveis em logs).

**Proposta:**

- Anonimização de dados pessoais nos logs
- Banner de consentimento granular
- Exportação de dados do usuário (portabilidade)
- Retenção automática (deletar documentos após X dias)

**Status:** backlog.

---

## 7.13 Backup e Disaster Recovery

**Contexto:** Sem backup automatizado do PostgreSQL (BT-27).

**Proposta:**

- Backups diários automáticos no Railway
- Replicação multi-região
- Plano de recuperação documentado (RTO/RPO)

**Status:** débito técnico BT-27.

---

## 7.14 En-US e Outros Idiomas

**Contexto:** i18n está preparado mas só pt-BR está ativo.

**Proposta:**

- Tradução completa para en-US
- Detecção automática de idioma do browser
- Mensagens do LLM no idioma do usuário

**Status:** backlog.

---

## Resumo de Prioridades

| Prioridade | Feature                | Motivação                         |
| ---------- | ---------------------- | --------------------------------- |
| Alta       | Streaming real (BT-02) | UX e latência                     |
| Alta       | RAG/pgvector           | Escalabilidade do chat            |
| Média      | Multi-provider LLM     | Redução de custo e vendor lock-in |
| Média      | Preview deploys        | Velocidade de desenvolvimento     |
| Média      | Coverage 80%           | Qualidade e regressão             |
| Baixa      | WhatsApp / Email       | Engajamento do usuário            |
| Baixa      | Atomic Design          | Manutenibilidade a longo prazo    |

---

_Fim da documentação._
