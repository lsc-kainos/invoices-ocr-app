# Invoice OCR Case

## Contexto

Case técnico de OCR como etapa do processo seletivo. O candidato tem em média **5 dias** para entregar a solução, mas a empresa explicita que **um protótipo funcional é mais valorizado do que o tempo gasto** na entrega.

## Objetivo

Projetar e implementar uma solução que permita ao usuário:

1. Fazer upload de documentos em uma página web
2. Obter o texto extraído via OCR
3. Solicitar explicações interativas (via LLM) sobre os dados extraídos

---

## Requisitos do case (estritos)

### Banco de dados

- Modelagem com **Prisma ORM**

### Frontend

- Página web simples em **React** (recomendado: framework **Next.js**)
- Permitir upload de imagem de invoice
- Implementar mecanismos de feedback (indicador de progresso, mensagens de sucesso/erro)

### Backend

- Serviço backend usando o framework **NestJS** para:
  - Lidar com upload de imagens
  - Gerenciar processamento OCR
  - Integrar com LLM
  - Armazenar resultados no banco

### Autenticação e permissões

- Usuário deve estar **autenticado** antes de fazer upload
- Pode usar qualquer ferramenta open-source de autenticação
- Decisão livre: autenticação no app Next ou na API Nest

### Funcionalidades do sistema

**Integração com LLM (contexto e explicação)**

- Integrar um LLM (ex: GPT-4) para explicar ou prover contexto sobre o texto extraído
- Permitir que usuários façam perguntas sobre as informações extraídas

**Visualização de documentos enviados**

- Listar todos os documentos previamente enviados pelo usuário
- Mostrar a informação extraída + interações com a LLM associadas

**Download de documentos com texto extraído**

- Permitir download dos documentos enviados com o texto extraído + interações com a LLM anexados

### Entregáveis

- **(obrigatório)** Link com o repositório do código-fonte (frontend e backend)
- **(obrigatório)** Instruções de setup e execução local
- **(obrigatório)** Link com o app deployado (recomendado: **Vercel**)

### Critérios de avaliação

- Aplicação de **boas práticas de desenvolvimento** no frontend e backend
- **Soluções funcionais são favorecidas** — se nem todas as features puderem ser entregues, focar nas mais críticas

---

## Stack escolhida

### Repositório

- **Monorepo** com `npm workspaces` + **Turborepo** para orquestração de tasks
- Estrutura: `apps/web` (Next), `apps/api` (Nest), `packages/shared-types` (DTOs compartilhados)
- Estratégia de merge: **squash and merge** na `main` com PRs descritivos

### Frontend

- **Next.js** (App Router) — exigido pelo case
- **shadcn/ui + Tailwind** — componentes acessíveis com customização total
- **Tema customizado** inspirado na identidade visual do produto (preto sólido, branco quente, acentos marrom)
- **NextAuth.js** — autenticação OAuth (Google + GitHub)
- **next-themes** — multi-tema (claro/escuro/sistema), persistência via localStorage
- **next-intl** — internacionalização configurada com pt-BR no momento, en-US no backlog

### Backend

- **NestJS** — exigido pelo case
- **Prisma ORM** — exigido pelo case
- **class-validator + class-transformer** — validação declarativa de DTOs
- **@nestjs/throttler** — rate limiting nativo
- **helmet** — headers de segurança
- **Jest** — testes unitários e de integração
- **Playwright** — testes end-to-end

### Banco de dados e storage

- **PostgreSQL** (Railway) — relacional, suporte robusto, integra nativamente com Prisma
- **Railway Volumes** — armazenamento persistente atrelado ao serviço da API

### IA

- **OpenAI GPT-4o (vision + chat)** — single provider para OCR e LLM, simplifica autenticação, billing e logging

### Deploy

- **Railway** — frontend, backend, Postgres e volume na mesma plataforma

### Tooling de infraestrutura (dia 0)

- ESLint + Prettier
- Husky + lint-staged (pre-commit hooks)
- Commitlint + conventional commits
- `.editorconfig`
- GitHub Actions (lint, typecheck, test, build em PRs)

---

## Decisões arquiteturais e justificativas

### Stack única OpenAI (vision + chat) em vez de Google Vision + LLM separada

Reduz dependências, chaves de API, dashboards de billing e observabilidade. GPT-4o aceita imagem direto no prompt e retorna texto estruturado com qualidade adequada para invoices. As funções de extração e chat compartilham a mesma SDK e modelo.

### SDK direto da OpenAI em vez de LangChain

LangChain agrega valor para multi-provider, agentes complexos e pipelines RAG com múltiplos retrievers — nada disso está em escopo. Para function calling simples (`get_full_document`), o SDK nativo é mais transparente, mais fácil de debugar e demonstra maturidade técnica. Evolução para LangChain ou abstração própria fica documentada como possibilidade.

### Function calling (sumário + texto sob demanda) em vez de RAG inicial

Cada documento gera um resumo estruturado armazenado no banco. No chat, o modelo recebe os resumos dos documentos selecionados e tem acesso a uma tool `get_full_document(id)` que ele invoca quando precisa de detalhe. Equilibra custo (tokens reduzidos) com fidelidade (texto completo disponível sob demanda). Mais simples que pgvector para o escopo atual; evolução natural para RAG está descrita no backlog.

### Railway Volumes para storage (decisão pragmática para o case)

Para o escopo de um teste técnico, manter storage na mesma plataforma do deploy reduz complexidade operacional, número de credenciais e superfície de configuração. Trade-offs aceitos:

- Volume é montado em apenas um serviço (a API). Frontend acessa via endpoints autenticados que servem signed URLs internas com expiração.
- Sem CDN edge, sem zero-egress como teria em R2.
- Coupling entre lifecycle do serviço e do volume.

**Em produção, a evolução natural seria Cloudflare R2** (S3-compatível, zero egress, free tier de 10 GB). Migração trivial: a interface de storage no NestJS é abstraída por um service que pode trocar implementação local por S3 sem mexer em domínio.

### Railway para tudo em vez de Vercel split

A recomendação original de usar Vercel é orientação, não requisito. NestJS roda como serviço Node de longa duração, encaixa naturalmente no Railway sem adaptação para serverless. Postgres co-localizado elimina latência de rede e simplifica configuração. Frontend Next.js também funciona bem em Railway. Trade-off: Vercel teria edge network mais ampla e CI/CD nativo para Next, mas para o escopo do case isso não justifica a complexidade de duas plataformas.

### NextAuth com Google + GitHub

Dois providers cobrem a maior parte dos usuários técnicos. GitHub sinaliza alinhamento com a audiência de avaliação (engenheiros). Email/senha foi descartado para reduzir superfície de auth (reset de senha, validação de email, captcha). Adição de outros providers é trivial via NextAuth.

### shadcn/ui em vez de bibliotecas tradicionais (Material UI, Chakra)

Componentes copiados para o projeto (não importados como dependência), permitindo customização total e bundle menor. Acessibilidade nativa via Radix UI por baixo. Visual moderno alinhado com o que se espera de uma fintech.

### Tema customizado inspirado na identidade do produto

Paleta sóbria de fintech premium em estética **café/conhaque sobre preto**: fundo preto absoluto, tipografia em branco cremoso (com leve tom amarelado), primary em laranja-cobre quente. Estética próxima a marcas de luxo (Hermès, leather goods) — sinaliza maturidade visual e atenção ao contexto da empresa avaliadora.

Valores OKLCH base no `globals.css` (dark mode):

```css
.dark {
  --background: oklch(0 0 0); /* preto absoluto */
  --foreground: oklch(0.8074 0.0142 93.01); /* branco cremoso */
  --primary: oklch(0.473 0.137 46.2); /* cobre/conhaque */
  --secondary: oklch(0.205 0 0); /* cinza escuro */
  --secondary-foreground: oklch(0.9663 0.008 98.88); /* claro sobre dark */
  --accent: oklch(0.213 0.0078 95.42); /* preto morno */
  --accent-foreground: oklch(0.9663 0.008 98.88);
  --muted: oklch(0.2213 0.0038 106.71);
  --border: oklch(0.3618 0.0101 106.89);
  --ring: oklch(0.6724 0.1308 38.76); /* cobre vibrante */
  --destructive: oklch(0.6368 0.2078 25.33); /* vermelho discreto */
}
```

Light mode mantém a mesma família de cor com primary em cobre claro `oklch(0.6171 0.1375 39.04)` sobre fundo bege quente. Tema completo no arquivo `apps/web/app/globals.css`.

### Organização de componentes plana com hooks de domínio

Em vez de Atomic Design (overhead cognitivo desproporcional para o tamanho do projeto), separação clara entre **lógica e apresentação** via hooks customizados:

```
components/
├── ui/                          # primitivos do shadcn
├── features/
│   └── document-upload/
│       ├── document-upload.tsx  # presentation
│       └── use-document-upload.ts # logic, fetch, state
└── layout/                      # header, sidebar, providers
```

Cada feature tem seu hook (`useDocumentUpload`, `useChatStream`, `useDocumentList`) que encapsula fetch, estado local e handlers. Componentes ficam dedicados a renderização. Facilita testes (hooks testados isoladamente), manutenção (mudança de fonte de dados não toca o componente) e reuso.

### Cobertura de testes focada em fluxos críticos em vez de coverage global

Em vez de perseguir 80% de coverage médio (que força testar controllers triviais), o foco é **100% de cobertura nos fluxos críticos**, com peso maior no backend (onde está a lógica de negócio):

- Pipeline OCR (upload → vision → persistência)
- Integração LLM (chat com function calling)
- Autenticação e autorização (RBAC, ownership checks)
- Validação de DTOs
- Endpoints expostos (testes de integração)

E2E com Playwright cobrindo as jornadas principais (login → upload → visualização → chat → download). Demonstra maturidade técnica maior do que uma métrica numérica artificial.

### Estrutura modular do NestJS

Módulos isolados com responsabilidades claras:

- `auth` — estratégias de autenticação, guards, decorators
- `users` — CRUD de usuários, RBAC (roles)
- `ocr` — integração com vision API, processamento de imagem
- `documents` — gestão de documentos, persistência, signed URLs
- `chat` — integração com LLM, function calling, gestão de contexto

`chat` é separado de `ocr` por terem responsabilidades, dependências e ciclos de evolução distintos.

### i18n configurado desde o dia 1 (somente pt-BR ativo)

Toda string de UI vai por `t('key')` desde o primeiro componente. Estrutura `messages/pt-BR.json` e config do `next-intl` prontas. Adicionar `en-US.json` posteriormente é trivial — não exige refatoração. Custo inicial baixo, ganho enorme se o backlog de internacionalização for puxado.

### Tooling de infraestrutura no dia 0

ESLint, Prettier, Husky, lint-staged, commitlint, GitHub Actions configurados antes de qualquer feature. Garante que todo commit nasce limpo e padronizado. Sinaliza disciplina de processo, não só de código.

### Squash and merge como estratégia de versionamento

Histórico linear na `main` com commits descritivos por PR. Evita poluição com commits de "fix typo", "wip", "tentando deploy". Avaliador olhando o histórico vê uma narrativa clara de evolução do projeto.

---

## Segurança

### Autenticação

- NextAuth com OAuth (Google + GitHub)
- `NEXTAUTH_SECRET` forte gerado via `openssl rand -base64 32`
- Cookies com `httpOnly` e `secure` em produção
- Session expiry de 7 dias com renovação por atividade

### Autorização

- **Toda query no Prisma filtra por `userId`** — usuário A nunca acessa documentos do B
- Guards no NestJS aplicados via decorator em todos os endpoints protegidos
- Validação dupla: token válido + ownership do recurso
- Role-based: `USER` e `ADMIN` (admin acessa rotas administrativas)

### Rate limiting (`@nestjs/throttler`)

- **Upload:** 5 requisições/min por usuário
- **Chat:** 15 requisições/min por usuário
- **OCR processing:** 3 documentos/min por usuário (controla custo de tokens)
- **Auth (signup/login):** 5 requisições/min por IP

Limites pensados para fintech: rígidos o suficiente para inviabilizar abuso, generosos o suficiente para uso humano normal. Configuráveis via env vars para ajuste sem deploy.

### Validação de upload

- Tipos aceitos: JPG, PNG, PDF (validação por **magic bytes**, não só extensão)
- Tamanho máximo: 10 MB
- Sanitização de nome de arquivo
- Verificação de mime-type no cliente e no servidor

### Storage

- Documentos em **Railway Volume** privado, fora da raiz pública do serviço
- Acesso exclusivo via endpoints autenticados da API
- Path com UUID, sem informação identificável do usuário
- Nunca exposição direta do filesystem; cliente só recebe URLs assinadas pela API com expiração curta (15 min)

### Prompt injection

- System prompt restritivo: o modelo é instruído a tratar conteúdo de documentos como dado, nunca como instrução
- Delimitadores XML claros entre instruções e conteúdo extraído
- Outputs do modelo são tratados como texto, nunca executados

### CORS

- Configuração restritiva via env var `ALLOWED_ORIGINS` (lista separada por vírgula)
- Sem wildcards em produção
- Validação no bootstrap do NestJS

### LGPD

- **Direito ao esquecimento:** deleção em cascata de usuário remove todos os documentos, mensagens e metadados associados (`onDelete: Cascade` no Prisma + remoção dos arquivos no volume)
- **Privacy policy:** página estática descrevendo dados coletados, finalidade e retenção
- **Minimização:** coletamos apenas email, nome e avatar (via OAuth)
- **Direito de acesso:** usuário visualiza todos seus documentos no app
- **Segurança:** dados em trânsito via HTTPS; dados em repouso criptografados pelo provider (Postgres no Railway, volume no Railway)

### Outras práticas

- Secrets exclusivamente em variáveis de ambiente (configuradas direto no Railway)
- `.env.example` no repositório, `.env` no `.gitignore`
- HTTPS forçado em produção
- Headers de segurança (`helmet` no NestJS, headers nativos do Next)
- Logs sem dados sensíveis (sem token, sem conteúdo de documentos)

---

## Datasets de teste

Estratégia em duas camadas para validar o pipeline OCR:

### Camada 1 — Validação genérica (rápida)

Para garantir que o pipeline funciona end-to-end (upload → vision → texto → chat):

- **Fixtures sintéticas locais**: invoices geradas/anonimizadas para smoke tests sem dependência de dados terceiros.
- **SROIE 2019** (`priyank-m/SROIE_2019_text_recognition`): 973 recibos escaneados reais em inglês. Bom para testar robustez com imagens "sujas".
- **Hugging Face: `mychen76/invoices-and-receipts_ocr_v1`**: invoices + recibos com anotações para validação.

### Camada 2 — Foco brasileiro (peso na avaliação)

Notas brasileiras têm estrutura própria (CNPJ, CFOP, valor total, data emissão, chave NF-e de 44 dígitos). O domínio alvo envolve documentos fiscais brasileiros, especialmente notas usadas por empresas de construção e incorporação.

- 3–5 NF-e reais (anonimizadas, removendo CPF/dados pessoais)
- 2–3 NFS-e (notas de serviço de prefeituras)
- 1–2 boletos
- Templates DANFE públicos para casos de borda

Pasta `samples/` no repositório com esses exemplos. System prompt do extractor menciona explicitamente os campos brasileiros relevantes (CNPJ emitente, valor total, data emissão, chave de acesso, CFOP).

### Geração de PDFs

A partir das imagens, via `img2pdf` (Python) ou `pdf-lib` (Node). Não há necessidade de dataset PDF puro para o escopo do case.

---

## Backlog (após o core)

### Funcionalidades

#### Painel de admin

- Página `/admin` acessível apenas a usuários com role `ADMIN`
- Gestão de usuários: listar, ativar/desativar, alterar roles
- Analytics: storage utilizado por usuário, total de requisições à IA, custo estimado por usuário e total
- Auditoria: log de ações sensíveis (deleções, mudanças de role)

#### Storage em Cloudflare R2

- Migração de Railway Volumes para R2
- Vantagens: S3-compatível, zero egress, CDN edge nativo, free tier 10 GB
- Migração trivial graças à abstração de storage no service do Nest

#### RAG com pgvector

- Indexação de chunks de cada documento via embeddings (`text-embedding-3-small` da OpenAI)
- Postgres com extensão `pgvector` para busca semântica
- Substitui a estratégia de "sumário + sob demanda" quando o volume de documentos por usuário cresce
- Permite chat sobre toda a base do usuário sem estourar contexto

#### Multi-provider LLM

- Abstração de provider LLM via interface (sem LangChain — implementação própria leve)
- Permite trocar OpenAI por Anthropic ou Google sem mudar código de domínio
- Útil para fallback em caso de outage e otimização de custo por tipo de tarefa

#### Email transacional (Resend)

- Notificação após processamento de documento longo
- Recuperação de senha (caso email/password seja adicionado)
- Notificações de admin (novos usuários, alertas de quota)

#### Internacionalização full

- en-US como segundo locale
- Formatação de números, datas e moedas por locale
- Detecção automática via header `Accept-Language` com override manual

### Qualidade técnica

#### Cobertura de testes ampliada

- E2E com Playwright cobrindo todas as jornadas
- Coverage global mirando 80% após o core estar consolidado
- Testes de carga em endpoints de OCR e chat

#### Atomic Design

- Refatoração da estrutura de componentes para Atoms/Molecules/Organisms quando o número de telas e componentes compartilhados justificar

#### Observabilidade

- Logs estruturados (Pino ou Winston) com correlation IDs
- Métricas via Prometheus ou OpenTelemetry
- Tracing distribuído de requisições que passam por múltiplos serviços
- Dashboard de uso de IA (tokens consumidos, custo por endpoint, latência)

#### Cache de respostas LLM

- Cache de embeddings e respostas para queries idênticas
- Redis ou Postgres com TTL
- Reduz custo e latência

#### Versionamento de prompts

- Prompts versionados em código com testes de regressão
- A/B testing de prompts em produção

### Segurança avançada

#### 2FA

- TOTP via app autenticador
- Obrigatório para admins

#### SSO empresarial

- SAML/OIDC para clientes corporativos
- Configuração por tenant

#### Audit logging

- Registro imutável de ações sensíveis (deleção de dados, alteração de roles, exportação)
- Retenção mínima de 12 meses

#### Anonimização para treinamento

- Caso o produto decida usar dados para fine-tuning, pipeline de anonimização (PII removido) antes da exportação

#### Compliance LGPD avançada

- Banner de consentimento granular (analytics opcional)
- Portal de portabilidade (export completo dos dados do usuário em JSON)
- Termo de uso e política de privacidade versionados com aceite registrado

### Infraestrutura

#### CI/CD robusto

- Preview deploys por PR
- Promoção automatizada para staging e produção com aprovação manual
- Rollback automático em caso de falha de health check

#### Backup e disaster recovery

- Backups diários do Postgres
- Restore automatizado testado mensalmente

#### Multi-região

- CDN para assets estáticos
- Réplica de leitura do Postgres em outra região
