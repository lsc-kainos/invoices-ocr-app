# invoices-ocr-app

OCR + LLM chat sobre invoices — case técnico Paggo.

## Stack

- Monorepo: npm workspaces + Turborepo
- `apps/web`: Next.js 16 (App Router, Tailwind)
- `apps/api`: NestJS 11
- `packages/shared-types`: DTOs compartilhados

## Setup local

```bash
nvm use            # Node 22 (ver .nvmrc)
npm install        # instala deps de todos os workspaces
npm run dev        # sobe web (3000) e api (3001) em paralelo
```

Documentação completa do case: `docs/paggo-ocr-case-spec.md`.
