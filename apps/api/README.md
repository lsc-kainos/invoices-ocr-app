# @invoices-ocr/api

Backend NestJS 11 do case técnico Paggo — OCR + LLM chat sobre invoices.

## Módulos

| Módulo          | Responsabilidade                                    | Rota base                        |
| --------------- | --------------------------------------------------- | -------------------------------- |
| `auth`          | JWT validation, guards, decorators, RBAC            | —                                |
| `users`         | CRUD de usuários, sync interno                      | `/api/v1/users`                  |
| `health`        | Healthcheck com `SELECT 1`                          | `/health`                        |
| `documents`     | Upload, CRUD, signed URLs, listagem                 | `/api/v1/documents`              |
| `ocr`           | Extração OCR (OpenAI vision), schemas, prompts      | —                                |
| `chat`          | Chat workspace + por documento, function calling    | `/api/v1/chat`                   |
| `download`      | Geração de ZIP (original + texto + transcript)      | `/api/v1/documents/:id/download` |
| `ai-runtime`    | Versionamento de prompts LLM (extractor + chat)     | `/api/v1/admin/llm-configs`      |
| `admin/metrics` | Métricas de uso para ADMIN                          | `/api/v1/admin/metrics`          |
| `admin/queues`  | Bull Board (observabilidade de filas)               | `/admin/queues`                  |
| `storage`       | Abstração de storage (Volume local / Cloudflare R2) | —                                |

## Infraestrutura

- **Prisma 6** — ORM com PostgreSQL
- **BullMQ + Redis** — fila distribuída para jobs OCR
- **@nestjs/throttler** — rate limiting por user
- **helmet** — headers de segurança
- **zod** — validação de env schema no bootstrap

## Testes

```bash
npm run test        # unit + integration (Jest, 52+ specs)
npm run test:e2e    # E2E com banco real
npm run test:cov    # coverage report
```

Para rodar um único teste:

```bash
cd apps/api && npx jest ocr.service
```

## Env

Todas as variáveis são validadas por `src/config/env.schema.ts` no bootstrap.
Ver `.env.example` na raiz do monorepo para referência completa.

## Seed

```bash
npm run db:seed:llm   # popula configs LLM padrão no banco
```
