# 2. AI Workflow

> Como a inteligência artificial foi integrada ao fluxo de desenvolvimento, desde a especificação até o code review.

---

## 2.1 Implementação com IA: Estratégia Macro

Dado o tempo limitado (case técnico), a IA foi usada como **multiplicador de produtividade**, não como substituto do julgamento técnico:

- **Especificação:** IA auxiliou na estruturação do SDD e na identificação de edge cases
- **Geração de código:** scaffolding de módulos NestJS, componentes React, testes boilerplate
- **Refatoração:** sugestões de melhoria de performance e legibilidade
- **Debug:** análise de logs e stack traces

**Princípio:** IA gera, humano revisa e decide.

---

## 2.2 Guardrails de Qualidade

Para evitar a deterioração da codebase por geração descontrolada, foram estabelecidos guardrails rigorosos:

### Linting e Formatação

- **ESLint:** regras strict para TypeScript (no-explicit-any, no-unused-vars)
- **Prettier:** formatação automática e consistente
- **Execução:** pre-commit via Husky + lint-staged

### Commits

- **commitlint:** validação de mensagens no padrão Conventional Commits
- **Husky:** bloqueia commits que não passem por lint/teste/typecheck

### CI/CD

- **GitHub Actions:** pipeline que roda lint, typecheck e testes em todo PR
- **Bloqueio:** PRs com checks falhos não podem ser mergeados

---

## 2.3 Code Review Automatizado

- **Codex / IA:** revisão automatizada de PRs identificando problemas de segurança, performance e legibilidade
- **Humano:** validação de arquitetura e decisões de negócio
- **Checklist:** cada PR deve passar por revisão de código + testes + aprovação

---

## 2.4 Superpowers Plans

Uso de planos estruturados para tarefas complexas:

- **Planos de implementação:** antes de tocar código, um plano detalhado era produzido
- **Tracer bullets:** implementação vertical de features (do frontend ao backend)
- **Revisão de planos:** planos eram revisados antes da execução para evitar retrabalho

Isso evitou o anti-padrão de "codar primeiro, pensar depois".

---

## 2.5 Test Coverage: Foco nas Features Principais

A IA auxiliou na geração de testes, mas com diretrizes claras:

- **Fluxos críticos primeiro:** OCR, auth, chat, download
- **Edge cases identificados:** uploads grandes, PDFs multi-página, tokens inválidos
- **Não perseguir coverage global:** 100% nos fluxos críticos > 80% global com testes triviais

**Resultado:** 52+ specs no backend, 28+ testes no frontend, cobertura E2E das jornadas principais.

---

## 2.6 Prompt Engineering para o Produto

A IA não foi usada apenas para desenvolvimento, mas também para o **produto em si**:

- **OCR:** GPT-4o vision com prompts estruturados para extração de campos brasileiros (CNPJ, chave NF-e, CFOP)
- **Chat:** system prompts versionados e configuráveis via `LlmConfig`
- **Classificação:** prompt para identificar tipo de documento e rejeitar fora de escopo
- **Saída estruturada:** Zod schemas para garantir formato consistente das respostas do LLM

---

## 2.7 Lições Aprendidas

| ✅ O que funcionou                | ❌ O que evitar                          |
| --------------------------------- | ---------------------------------------- |
| Especificar antes de gerar código | Gerar código sem contexto de arquitetura |
| Revisar todo output da IA         | Aceitar sugestões cegamente              |
| Guardrails automatizados          | Depender apenas de revisão humana        |
| Foco em testes de fluxos críticos | Perseguir coverage sem qualidade         |
| Prompts versionados e testados    | Prompts hardcoded espalhados             |

---

_Próximo: [Arquitetura da Solução](./03-architecture.md)_
