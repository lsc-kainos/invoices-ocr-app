# 1. Metodologia e Forma de Agir

> Como o projeto foi conduzido, desde a leitura do case até o deploy em produção.

---

## 1.1 Especificação Clara dos Requisitos

Antes de escrever qualquer linha de código, foi produzida uma especificação técnica completa (`docs/paggo-ocr-case-spec.md`) contendo:

- **Decomposição em fases (F0-F4):** cada fase representa um marco entregável
- **Decisões de stack justificadas:** por que Next.js + NestJS, por que PostgreSQL, por que OpenAI
- **Critérios de aceitação por feature:** o que significa "pronto" para cada fase
- **Backlog separado do core:** features pós-core claramente identificadas

Isso evitou o anti-padrão de começar a codar sem saber o destino.

---

## 1.2 Spec Driven Development (SDD)

Para cada fase, foi produzido um documento de spec/design antes da implementação:

- Schema Prisma detalhado
- Contratos de API (DTOs compartilhados em `packages/shared-types`)
- Fluxos de dados (upload → OCR → storage → resposta)
- Decisões de arquitetura com justificativas

O SDD funcionou como "contrato" entre o que foi pensado e o que foi implementado.

---

## 1.3 Deploy Desde o Dia 0

A aplicação foi deployada na Railway desde o primeiro dia (F0). Isso garantiu:

- **Feedback rápido:** problemas de ambiente foram detectados cedo
- **Integração contínua real:** cada PR mergeado ia para produção
- **Confiança no processo:** o deploy não era um evento traumático no final

Estratégia: trunk-based development com squash and merge na `main`.

---

## 1.4 Monorepo com npm Workspaces + Turborepo

A estrutura foi pensada para escalar:

```
invoices-ocr-app/
├── apps/
│   ├── web/              # Next.js 16 — frontend
│   └── api/              # NestJS 11 — backend
├── packages/
│   └── shared-types/     # DTOs compartilhados
├── samples/              # Dataset de teste (NF-e, NFS-e, boletos)
└── docs/                 # Documentação técnica
```

**Por que monorepo?**

- Compartilhamento de tipos entre frontend e backend sem publicação de pacotes
- Scripts unificados (`npm run dev` sobe ambos)
- CI/CD simplificado
- Turborepo para cache de builds e execução paralela de tarefas

---

## 1.5 Convenções desde o Início

- **Commits convencionais:** `feat:`, `fix:`, `docs:`, `refactor:` — via commitlint
- **Branches semânticas:** `feat/nome`, `fix/nome`, `docs/nome`
- **Histórico linear:** squash and merge obrigatório
- **Code review:** todos os PRs revisados antes do merge

---

## 1.6 Fluxo de Trabalho

1. **Planejamento:** SDD + plan para a fase
2. **Implementação:** branch feature a partir da `main`
3. **Testes:** unitários + integração antes do PR
4. **Revisão:** code review (humano + automatizado)
5. **Merge:** squash and merge para `main`
6. **Deploy:** automático via Railway

---

## 1.7 Estratégia de Testes

Foco em **100% dos fluxos críticos**, não em coverage global:

- **Backend (Jest):** pipeline OCR, integração LLM, auth/RBAC, validação de DTOs, endpoints expostos
- **Frontend (Vitest):** componentes críticos, hooks de domínio, utilitários
- **E2E (Playwright):** jornada completa — login → upload → visualizar → chat → download

A meta de 80% coverage global ficou no backlog pós-core.

---

_Próximo: [AI Workflow](./02-ai-workflow.md)_
