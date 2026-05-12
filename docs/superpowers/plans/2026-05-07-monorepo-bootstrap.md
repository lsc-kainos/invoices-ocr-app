# Monorepo Bootstrap + Tooling Dia 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inicializar o monorepo `invoices-ocr-app` com `apps/web` (Next.js), `apps/api` (NestJS) e `packages/shared-types`, com tooling completo de dia 0 (ESLint/Prettier compartilhados, Husky + lint-staged, commitlint com conventional commits, GitHub Actions de CI) e o repositório publicado no GitHub.

**Architecture:** npm workspaces + Turborepo orquestrando 2 apps e 1 package interno. Cada app é scaffolded pela CLI oficial (create-next-app, @nestjs/cli) e referencia `@invoices-ocr/shared-types` via workspace protocol. Prettier compartilhado no root; ESLint mantém os configs de cada scaffold + `eslint-config-prettier` pra desligar regras conflitantes. Husky 9 + lint-staged formatam/linta apenas arquivos staged no pre-commit; commitlint valida mensagens no commit-msg. GitHub Actions roda lint + typecheck + build em todo PR usando cache do Turborepo.

**Tech Stack:** Node 22 LTS, npm 10, Turborepo 2, Next.js 16 (App Router + Tailwind), NestJS 11, TypeScript 5, Prettier 3, Husky 9, lint-staged 16, commitlint 19, GitHub Actions.

**Out of scope (próximos planos):**

- shadcn/ui, NextAuth, next-intl, next-themes, tema do produto
- Prisma schema + módulos de domínio do Nest (auth/users/ocr/documents/chat)
- helmet, @nestjs/throttler, class-validator
- OpenAI SDK e pipeline OCR/chat
- Dockerfile / Railway config / deploy
- Sample data brasileira (NF-e, NFS-e, boletos)

**Repo path note:** o working directory original podia conter espaços (`Example Labs/Projetos/invoices-ocr-app`). Sempre executar comandos a partir desse diretório com aspas duplas em `cd` quando necessário, e nunca passar o path inteiro pra subcomandos sem quoting.

**Pré-requisito adicional:** `gh` CLI instalado e autenticado (`gh auth status` deve retornar OK). Caso contrário, Task 13 fica bloqueada — instalar via gerenciador de pacote do SO e rodar `gh auth login`.

**Pré-requisitos verificados (2026-05-07):**

- Node v22.22.0 ✅
- npm 10.9.4 ✅
- git 2.54.0 ✅

---

## File Structure

Após esse plano, a estrutura final será:

```
invoices-ocr-app/
├── .editorconfig
├── .github/
│   └── workflows/
│       └── ci.yml               (lint + typecheck + build em PRs)
├── .gitignore
├── .husky/
│   ├── commit-msg               (commitlint)
│   └── pre-commit               (lint-staged)
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── CLAUDE.md                    (já existe)
├── README.md                    (criado nesse plano, mínimo)
├── commitlint.config.cjs
├── docs/                        (já existe)
├── package.json                 (root, workspaces + scripts turbo + lint-staged)
├── package-lock.json            (gerado pelo npm install)
├── tsconfig.base.json           (shared compiler options)
├── turbo.json                   (pipelines: dev, build, lint, test, typecheck)
├── apps/
│   ├── web/                     (Next.js 16, App Router, Tailwind)
│   │   ├── app/
│   │   ├── public/
│   │   ├── eslint.config.mjs    (estende next + prettier)
│   │   ├── next.config.ts
│   │   ├── package.json         (name: @invoices-ocr/web)
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── ...
│   └── api/                     (NestJS 11)
│       ├── src/
│       ├── test/
│       ├── eslint.config.mjs    (estende nest + prettier)
│       ├── nest-cli.json
│       ├── package.json         (name: @invoices-ocr/api)
│       ├── tsconfig.json
│       └── ...
└── packages/
    └── shared-types/
        ├── src/
        │   └── index.ts
        ├── eslint.config.mjs    (config mínimo + prettier)
        ├── package.json         (name: @invoices-ocr/shared-types, type: module)
        └── tsconfig.json
```

**Decomposição:**

- **Root** = orquestração e contratos comuns (workspaces, turbo, tsconfig base, prettier compartilhado, hooks de git, CI).
- **apps/\*** = unidades deployáveis, cada uma com seu lifecycle e seu eslint estendendo `eslint-config-prettier`.
- **packages/shared-types** = único package interno por enquanto; tipos compartilhados entre web ↔ api (DTOs de upload, documento, mensagem de chat). Começa vazio com export placeholder; será populado no plano de domínio.

**Estratégia de commits do plano:** 4 commits separados na main, cada um auto-suficiente:

1. `chore: bootstrap monorepo with web (Next 16), api (Nest 11), shared-types`
2. `chore: add shared Prettier config and ESLint integration`
3. `chore: add Husky, lint-staged, and commitlint for git hooks`
4. `ci: add GitHub Actions workflow for lint, typecheck and build`

Push final agrupa os 4 commits no remote criado.

---

## Task 1: Inicializar root do monorepo (workspaces + arquivos base)

**Files:**

- Create: `package.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `tsconfig.base.json`
- Create: `README.md`

- [ ] **Step 1.1: Criar `package.json` na raiz**

`package.json`:

```json
{
  "name": "invoices-ocr-app",
  "version": "0.0.0",
  "private": true,
  "description": "OCR + LLM chat sobre invoices — projeto Invoice OCR",
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 1.2: Criar `.gitignore`**

`.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.turbo/

# Test outputs
coverage/
*.lcov

# Environment
.env
.env.local
.env.*.local
!.env.example

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE / OS
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
.DS_Store
Thumbs.db

# Prisma (artefatos gerados)
**/prisma/migrations/dev.db
**/prisma/migrations/dev.db-journal

# Uploads locais
uploads/
samples/.cache/
```

- [ ] **Step 1.3: Criar `.editorconfig`**

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

- [ ] **Step 1.4: Criar `.nvmrc`**

`.nvmrc`:

```
22
```

- [ ] **Step 1.5: Criar `tsconfig.base.json`**

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 1.6: Criar `README.md` mínimo**

`README.md`:

````markdown
# invoices-ocr-app

OCR + LLM chat sobre invoices — case técnico de OCR.

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
````

Documentação completa do case: `docs/invoices-ocr-case-spec.md`.

````

- [ ] **Step 1.7: Verificar que arquivos foram criados**

Run:
```bash
ls -la package.json .gitignore .editorconfig .nvmrc tsconfig.base.json README.md
````

Expected: 6 arquivos listados, todos com tamanho > 0.

---

## Task 2: Criar diretórios `apps/` e `packages/`

**Files:**

- Create: diretório `apps/`
- Create: diretório `packages/`

- [ ] **Step 2.1: Criar diretórios**

Run:

```bash
mkdir -p apps packages
```

- [ ] **Step 2.2: Verificar**

Run: `ls -d apps packages`
Expected: `apps  packages` (ambos listados sem erro).

---

## Task 3: Scaffold `apps/web` (Next.js 16)

**Files:**

- Create: `apps/web/` (estrutura completa via create-next-app)
- Modify: `apps/web/package.json` (renomear para `@invoices-ocr/web`)
- Modify: `apps/web/tsconfig.json` (estender base)

- [ ] **Step 3.1: Rodar create-next-app dentro de `apps/`**

Run (a partir do root do monorepo):

```bash
cd apps && npx -y create-next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --skip-install \
  --eslint \
  --turbopack && cd ..
```

Expected: cria `apps/web/` com `app/`, `public/`, `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `eslint.config.mjs`. Sem `node_modules`. Sem prompt interativo.

Se a CLI fizer pergunta sobre algum flag novo (versões mudam), aceitar o default e anotar diferença pro próximo passo.

- [ ] **Step 3.2: Renomear o package no `apps/web/package.json`**

Editar `apps/web/package.json` — trocar o campo `name` de `"web"` para `"@invoices-ocr/web"`. Manter resto.

Antes:

```json
{
  "name": "web",
  ...
}
```

Depois:

```json
{
  "name": "@invoices-ocr/web",
  "version": "0.0.0",
  "private": true,
  ...
}
```

- [ ] **Step 3.3: Adicionar scripts `typecheck` e ajustar `dev` ao `apps/web/package.json`**

Garantir que o bloco `scripts` contém:

```json
"scripts": {
  "dev": "next dev --port 3000",
  "build": "next build",
  "start": "next start --port 3000",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

Substituir o que veio do scaffold pelos valores acima (preservando scripts adicionais que a CLI tenha gerado).

- [ ] **Step 3.4: Estender o `tsconfig.base.json` no `apps/web/tsconfig.json`**

Adicionar `"extends": "../../tsconfig.base.json"` como primeiro campo do JSON. Preservar `compilerOptions`, `include`, `exclude` que o scaffold gerou — só adicionar a linha `extends`.

Exemplo do topo do arquivo:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    /* ...mantém o que a CLI gerou... */
  },
  "include": [...],
  "exclude": [...]
}
```

- [ ] **Step 3.5: Verificar estrutura**

Run:

```bash
ls apps/web/app apps/web/package.json apps/web/next.config.ts apps/web/tailwind.config.ts
```

Expected: todos existem.

Run:

```bash
grep '"name"' apps/web/package.json
```

Expected: `"name": "@invoices-ocr/web",`

---

## Task 4: Scaffold `apps/api` (NestJS 11)

**Files:**

- Create: `apps/api/` (estrutura completa via @nestjs/cli)
- Modify: `apps/api/package.json` (renomear, ajustar porta)
- Modify: `apps/api/tsconfig.json` (estender base)
- Modify: `apps/api/src/main.ts` (porta 3001 via env)

- [ ] **Step 4.1: Rodar Nest CLI dentro de `apps/`**

Run (a partir do root):

```bash
cd apps && npx -y @nestjs/cli@latest new api \
  --strict \
  --package-manager npm \
  --skip-git \
  --skip-install && cd ..
```

Expected: cria `apps/api/` com `src/`, `test/`, `nest-cli.json`, `package.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`. Sem `node_modules`. Sem `.git`.

- [ ] **Step 4.2: Renomear o package no `apps/api/package.json`**

Editar campo `name` de `"api"` para `"@invoices-ocr/api"`.

Garantir que o bloco `scripts` contém ao menos:

```json
"scripts": {
  "build": "nest build",
  "start": "nest start",
  "dev": "nest start --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "typecheck": "tsc --noEmit"
}
```

Manter os scripts gerados pelo Nest CLI; apenas garantir que `dev` (apelido de `start:dev`) e `typecheck` existam, e renomear `start:dev` → `dev` se a CLI tiver gerado com outro nome.

- [ ] **Step 4.3: Estender base no `apps/api/tsconfig.json`**

Adicionar `"extends": "../../tsconfig.base.json"` como primeiro campo do JSON. Preservar `compilerOptions`, `include`, `exclude` que o scaffold gerou.

- [ ] **Step 4.4: Ajustar `apps/api/src/main.ts` pra usar porta 3001 e ler do env**

Substituir conteúdo de `apps/api/src/main.ts` por:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 4.5: Verificar estrutura**

Run:

```bash
ls apps/api/src apps/api/package.json apps/api/nest-cli.json apps/api/tsconfig.json
```

Expected: todos existem.

Run:

```bash
grep '"name"' apps/api/package.json
```

Expected: `"name": "@invoices-ocr/api",`

---

## Task 5: Criar `packages/shared-types`

**Files:**

- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`

- [ ] **Step 5.1: Criar `packages/shared-types/package.json`**

`packages/shared-types/package.json`:

```json
{
  "name": "@invoices-ocr/shared-types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

Decisão: por enquanto consumimos o pacote como TS source (sem build step). Web (Next/Turbopack) e API (Nest/SWC) compilam o TS direto. Quando precisar publicar ou rodar fora desse contexto, adiciona `tsc` build step. YAGNI agora.

- [ ] **Step 5.2: Criar `packages/shared-types/tsconfig.json`**

`packages/shared-types/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 5.3: Criar `packages/shared-types/src/index.ts` (placeholder)**

`packages/shared-types/src/index.ts`:

```ts
export const SHARED_TYPES_PACKAGE_VERSION = '0.0.0';
```

Justificativa: deixar export real (não vazio) pra garantir que `tsc --noEmit` rode sem warning de "isolatedModules requires at least one statement". DTOs reais entram no plano de domínio.

- [ ] **Step 5.4: Verificar**

Run:

```bash
ls packages/shared-types/src/index.ts packages/shared-types/package.json packages/shared-types/tsconfig.json
```

Expected: todos existem.

---

## Task 6: Adicionar `turbo.json`

**Files:**

- Create: `turbo.json`

- [ ] **Step 6.1: Criar `turbo.json` na raiz**

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 6.2: Verificar**

Run: `cat turbo.json | head -3`
Expected: primeira linha `{` e segunda contendo `$schema`.

---

## Task 7: Wire workspace deps + instalar tudo

**Files:**

- Modify: `apps/web/package.json` (adicionar dependência interna)
- Modify: `apps/api/package.json` (adicionar dependência interna)

- [ ] **Step 7.1: Adicionar `@invoices-ocr/shared-types` em `apps/web/package.json`**

Adicionar ao bloco `dependencies` do `apps/web/package.json`:

```json
"@invoices-ocr/shared-types": "*"
```

- [ ] **Step 7.2: Adicionar `@invoices-ocr/shared-types` em `apps/api/package.json`**

Adicionar ao bloco `dependencies` do `apps/api/package.json`:

```json
"@invoices-ocr/shared-types": "*"
```

- [ ] **Step 7.3: Rodar install na raiz**

Run (a partir do root do monorepo):

```bash
npm install
```

Expected:

- Cria um único `node_modules/` na raiz (com hoisting do npm workspaces).
- Cria `package-lock.json` na raiz.
- Symlinks em `node_modules/@invoices-ocr/web`, `node_modules/@invoices-ocr/api`, `node_modules/@invoices-ocr/shared-types` apontando pros workspaces.
- Sem erros. Pode aparecer warnings de peer deps — anotar mas não bloquear.

- [ ] **Step 7.4: Validar resolução de workspace**

Run:

```bash
ls -la node_modules/@invoices-ocr/
```

Expected: três symlinks (`api -> ../../apps/api`, `web -> ../../apps/web`, `shared-types -> ../../packages/shared-types`).

- [ ] **Step 7.5: Smoke test — typecheck em todos os workspaces**

Run:

```bash
npm run typecheck
```

Expected: todos os 3 workspaces rodam `tsc --noEmit` (ou equivalente) sem erro. Turbo deve mostrar `3 successful, 3 total`.

Se algum falhar: ler erro, corrigir tsconfig, re-rodar. Não avançar antes de typecheck verde.

- [ ] **Step 7.6: Smoke test — boot do `apps/web`**

Run em terminal separado (ou em background):

```bash
npm run dev --workspace=@invoices-ocr/web
```

Expected: log `▲ Next.js 16.x` + `Local: http://localhost:3000` em até 30s. Acessar `http://localhost:3000` deve mostrar a homepage default do create-next-app.

Encerrar com Ctrl+C antes de avançar.

- [ ] **Step 7.7: Smoke test — boot do `apps/api`**

Run em terminal separado:

```bash
npm run dev --workspace=@invoices-ocr/api
```

Expected: log do Nest startup + `API running on http://localhost:3001`. Curl em `http://localhost:3001` deve retornar `Hello World!` (controller default do scaffold).

Encerrar com Ctrl+C antes de avançar.

---

## Task 8: Inicializar git e fazer o primeiro commit

**Files:**

- Create: `.git/` (via `git init`)

- [ ] **Step 8.1: Inicializar repo git**

Run:

```bash
git init -b main
```

Expected: `Initialized empty Git repository in .../invoices-ocr-app/.git/`. Branch default já é `main`.

- [ ] **Step 8.2: Configurar identidade local (apenas se ainda não houver global)**

Run:

```bash
git config user.email >/dev/null 2>&1 || git config user.email "admin@invoices-ocr.local"
git config user.name >/dev/null 2>&1 || git config user.name "Lucas Comandulli"
```

Se já existem globals válidos, comandos viram no-op. Não sobrescrevem nada.

- [ ] **Step 8.3: Conferir o que vai entrar no commit**

Run:

```bash
git status
```

Expected: arquivos untracked devem incluir `.editorconfig`, `.gitignore`, `.nvmrc`, `CLAUDE.md`, `README.md`, `apps/`, `docs/`, `package.json`, `package-lock.json`, `packages/`, `tsconfig.base.json`, `turbo.json`. **Não deve aparecer** `node_modules/`, `.next/`, `.turbo/`, `dist/` (devem estar gitignored).

- [ ] **Step 8.4: Stage de tudo e commitar**

Run:

```bash
git add .
git status --short
```

Expected: lista de arquivos com `A` (added). Verificar de novo que não há nada tipo `node_modules/`.

Run:

```bash
git commit -m "chore: bootstrap monorepo with web (Next 16), api (Nest 11), shared-types"
```

Expected: commit criado, hash exibido, sem erro. (Não há hooks ainda, então commit passa direto.)

- [ ] **Step 8.5: Verificar log**

Run:

```bash
git log --oneline
```

Expected: uma linha mostrando o commit recém-criado.

---

## Task 9: Prettier compartilhado + ESLint integration

**Files:**

- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json` (root, adiciona prettier + eslint-config-prettier nas devDeps + scripts `format` e `format:check`)
- Modify: `apps/web/eslint.config.mjs` (adiciona `prettier` no final do array de configs)
- Modify: `apps/api/eslint.config.mjs` (idem)
- Create: `packages/shared-types/eslint.config.mjs`

- [ ] **Step 9.1: Criar `.prettierrc.json` na raiz**

`.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Justificativa: `prettier-plugin-tailwindcss` ordena classes do Tailwind no `apps/web` automaticamente. É o plugin oficial recomendado.

- [ ] **Step 9.2: Criar `.prettierignore` na raiz**

`.prettierignore`:

```
node_modules
.next
.turbo
dist
build
coverage
*.log
package-lock.json
.husky/_
```

- [ ] **Step 9.3: Adicionar Prettier + plugin + eslint-config-prettier nas devDeps do root**

Editar `package.json` raiz, no bloco `devDependencies`, adicionar:

```json
"prettier": "^3.4.0",
"prettier-plugin-tailwindcss": "^0.6.0",
"eslint-config-prettier": "^9.1.0"
```

Manter `turbo` e `typescript` que já estão lá.

- [ ] **Step 9.4: Adicionar scripts `format` e `format:check` no `package.json` raiz**

No bloco `scripts` do `package.json` raiz, adicionar:

```json
"format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml,css}\" --ignore-path .prettierignore",
"format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml,css}\" --ignore-path .prettierignore"
```

- [ ] **Step 9.5: Estender `prettier` no `apps/web/eslint.config.mjs`**

Abrir `apps/web/eslint.config.mjs`. No início do arquivo, adicionar import:

```js
import prettier from 'eslint-config-prettier';
```

No array exportado (geralmente `export default [...]`), adicionar `prettier` como **último** elemento. Exemplo:

```js
export default [...compat.extends('next/core-web-vitals', 'next/typescript'), prettier];
```

(Estrutura exata depende do que a CLI gerou — adaptar mantendo `prettier` por último.)

- [ ] **Step 9.6: Estender `prettier` no `apps/api/eslint.config.mjs`**

Mesma operação no `apps/api/eslint.config.mjs`: importar `eslint-config-prettier` e adicionar como último elemento do array de configs exportado.

- [ ] **Step 9.7: Criar `packages/shared-types/eslint.config.mjs`**

`packages/shared-types/eslint.config.mjs`:

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
```

Adicionar `@eslint/js` e `typescript-eslint` nas devDependencies do `packages/shared-types/package.json`:

```json
"devDependencies": {
  "typescript": "^5.7.0",
  "@eslint/js": "^9.17.0",
  "typescript-eslint": "^8.18.0",
  "eslint": "^9.17.0",
  "eslint-config-prettier": "^9.1.0"
}
```

Adicionar script `lint` ao `packages/shared-types/package.json`:

```json
"scripts": {
  "lint": "eslint .",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 9.8: Reinstalar dependências**

Run:

```bash
npm install
```

Expected: instala prettier, eslint-config-prettier e plugins novos. Sem erros.

- [ ] **Step 9.9: Aplicar Prettier em tudo**

Run:

```bash
npm run format
```

Expected: muitos arquivos ajustados (especialmente os que vieram dos scaffolds com aspas duplas / outras config). Saída tipo `apps/api/src/main.ts X ms`. Sem erros.

- [ ] **Step 9.10: Validar lint**

Run:

```bash
npm run lint
```

Expected: turbo roda lint em `web`, `api`, `shared-types`. Tudo passa. Se algum erro aparecer (regra do scaffold + prettier conflitando), ajustar `eslint-config-prettier` na ordem (deve ser **sempre o último**) e re-rodar.

- [ ] **Step 9.11: Validar typecheck (regressão)**

Run:

```bash
npm run typecheck
```

Expected: 3 workspaces ✅.

- [ ] **Step 9.12: Commitar**

Run:

```bash
git add .
git status --short
git commit -m "chore: add shared Prettier config and ESLint integration"
```

Expected: commit criado. Sem hooks ainda (Husky entra na próxima task).

---

## Task 10: Husky + lint-staged

**Files:**

- Create: `.husky/pre-commit`
- Modify: `package.json` (adiciona husky, lint-staged nas devDeps, script `prepare`, bloco `lint-staged`)

- [ ] **Step 10.1: Instalar husky e lint-staged como devDependencies do root**

Run (a partir do root):

```bash
npm install --save-dev husky lint-staged
```

Expected: ambos instalados sem erro.

- [ ] **Step 10.2: Adicionar script `prepare` no `package.json` raiz**

No bloco `scripts` do `package.json` raiz, adicionar:

```json
"prepare": "husky"
```

- [ ] **Step 10.3: Inicializar Husky**

Run:

```bash
npx husky init
```

Expected: cria diretório `.husky/` com `pre-commit` (contendo `npm test` por padrão) e adiciona o script `prepare` se ainda não existir.

- [ ] **Step 10.4: Substituir conteúdo do `.husky/pre-commit`**

Sobrescrever `.husky/pre-commit` com:

```sh
npx lint-staged
```

(Apenas essa linha. Husky 9 não usa mais shebang/source de helpers.)

- [ ] **Step 10.5: Adicionar config `lint-staged` no `package.json` raiz**

Adicionar no nível raiz do `package.json` (mesmo nível de `scripts`, `workspaces`, etc):

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{json,md,yml,yaml,css}": [
    "prettier --write"
  ]
}
```

- [ ] **Step 10.6: Smoke test do hook (sem commitar)**

Criar arquivo mal formatado, stage, rodar `lint-staged` direto:

```bash
printf 'export const foo   =    "bar"\n' > apps/web/lint-test.ts
git add apps/web/lint-test.ts
npx lint-staged
```

Expected:

- Prettier formata o arquivo (espaços normalizados, `"` → `'`, `;` final)
- Re-staging automático

Verificar:

```bash
cat apps/web/lint-test.ts
```

Expected: `export const foo = 'bar';`

Limpar antes de commitar:

```bash
git reset HEAD apps/web/lint-test.ts
rm apps/web/lint-test.ts
git status --short
```

Expected: nenhum arquivo `lint-test.ts` listado.

- [ ] **Step 10.7: Commitar setup do Husky + lint-staged**

Run:

```bash
git add .husky package.json package-lock.json
git status --short
git commit -m "chore: add Husky and lint-staged for pre-commit formatting"
```

Expected: o próprio commit dispara `pre-commit → lint-staged`, que não tem nada pra fazer (só mudou config), e o commit é criado normalmente.

- [ ] **Step 10.8: Verificar log**

Run:

```bash
git log --oneline
```

Expected: 3 commits — bootstrap, prettier/eslint, husky/lint-staged.

---

## Task 11: Commitlint + conventional commits

**Files:**

- Create: `commitlint.config.cjs`
- Create: `.husky/commit-msg`
- Modify: `package.json` (adiciona @commitlint/cli + @commitlint/config-conventional nas devDeps)

- [ ] **Step 11.1: Instalar commitlint**

Run:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

Expected: instala sem erro.

- [ ] **Step 11.2: Criar `commitlint.config.cjs` na raiz**

`commitlint.config.cjs`:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
  },
};
```

Justificativa: usar `.cjs` porque o package.json do root não tem `"type": "module"` mas commitlint suporta CJS direto. `subject-case` permite lower-case e sentence-case (mais natural em PT) mas bloqueia ALL CAPS, PascalCase e Start Case.

- [ ] **Step 11.3: Criar `.husky/commit-msg`**

`.husky/commit-msg`:

```sh
npx --no -- commitlint --edit "$1"
```

Tornar executável (Husky 9 normalmente já trata permissões mas garantir):

```bash
chmod +x .husky/commit-msg
```

- [ ] **Step 11.4: Smoke test — mensagem inválida deve falhar**

Run:

```bash
echo "mensagem ruim sem prefixo" | npx commitlint
```

Expected: exit code != 0, erro tipo `subject may not be empty` ou `type may not be empty`. Não cria commit nenhum (não há `git commit` envolvido).

- [ ] **Step 11.5: Smoke test — mensagem válida deve passar**

Run:

```bash
echo "docs: test commitlint validation" | npx commitlint
```

Expected: exit code 0, sem erros.

- [ ] **Step 11.6: Commitar setup do commitlint**

Run:

```bash
git add commitlint.config.cjs .husky/commit-msg package.json package-lock.json
git status --short
git commit -m "chore: add commitlint with conventional commits"
```

Expected: hooks rodam (`pre-commit` lint-staged + `commit-msg` commitlint), mensagem é válida, commit é criado. 4 commits no log.

- [ ] **Step 11.7: Verificar**

Run:

```bash
git log --oneline
```

Expected: 4 commits (bootstrap, prettier/eslint, husky/lint-staged, commitlint).

---

## Task 12: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 12.1: Criar diretório de workflows**

Run:

```bash
mkdir -p .github/workflows
```

- [ ] **Step 12.2: Criar `.github/workflows/ci.yml`**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: lint + typecheck + build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-

      - name: Install
        run: npm ci

      - name: Format check
        run: npm run format:check

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Build
        run: npm run build
```

Decisões:

- `npm ci` (não `install`) em CI — mais rápido e determinístico
- `format:check` antes do `lint` — feedback rápido em pure formatting issues
- `cache: npm` no setup-node usa `package-lock.json` automaticamente
- Cache do Turborepo separado pra acelerar `lint`/`typecheck`/`build`
- Single job com sequência de steps em vez de matrix — pra esse repo pequeno, paralelismo de jobs adiciona overhead sem benefício

- [ ] **Step 12.3: Validar YAML localmente (visual)**

Run:

```bash
cat .github/workflows/ci.yml
```

Expected: arquivo lê limpo, sem caracteres estranhos. Indentação consistente em 2 espaços.

(Validação real só acontece quando o GitHub recebe o arquivo — não há workflow runner local nesse plano.)

- [ ] **Step 12.4: Commitar**

Run:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, typecheck and build"
```

Expected: commit criado, hooks passam.

- [ ] **Step 12.5: Verificar log**

Run:

```bash
git log --oneline
```

Expected: 5 commits no total.

---

## Task 13: Criar repositório remoto no GitHub e push

**Files:** N/A (apenas operações de git/gh)

- [ ] **Step 13.1: Verificar `gh` CLI**

Run:

```bash
gh auth status
```

Expected: confirma autenticação ativa em `github.com` com escopo apropriado (`repo`, pelo menos). Se falhar, rodar `gh auth login` e voltar.

- [ ] **Step 13.2: Confirmar nome, owner e visibilidade com o usuário antes de criar**

Antes de rodar `gh repo create`, **pausar e confirmar**:

- Nome do repo no GitHub (default: `invoices-ocr-app`)
- Owner (conta pessoal ou organização — verificar com `gh api user --jq .login` e `gh api user/orgs --jq '.[].login'`)
- Visibilidade (`--public` ou `--private`)

Não prosseguir sem confirmação explícita do usuário, porque criar repo público com nome errado é difícil de reverter.

- [ ] **Step 13.3: Criar repositório e fazer push**

Run (substituir `<owner>` e ajustar `--public`/`--private` conforme confirmado na Step 13.2):

```bash
gh repo create <owner>/invoices-ocr-app \
  --private \
  --source=. \
  --remote=origin \
  --push \
  --description "OCR + LLM chat sobre invoices — case técnico de OCR"
```

Expected:

- Cria repo no GitHub
- Adiciona `origin` apontando pra ele
- Faz push da branch `main` com os 5 commits
- URL do repo é exibida ao final

- [ ] **Step 13.4: Verificar remote e push**

Run:

```bash
git remote -v
git log origin/main --oneline
```

Expected:

- `origin` aparece com URL do GitHub (fetch + push)
- 5 commits visíveis em `origin/main`

- [ ] **Step 13.5: Verificar que o CI rodou**

Run:

```bash
gh run list --limit 3
```

Expected: ao menos um run de CI listado (status `in_progress` ou `completed`). Se `completed success`, ✅. Se `failure`, ler logs com `gh run view --log-failed` e corrigir antes de prosseguir.

---

## Final verification checklist

- [ ] **Final 1: Estrutura final completa**

Run:

```bash
ls -F
ls -F apps/
ls -F packages/
```

Expected:

- Root: `CLAUDE.md  README.md  apps/  docs/  node_modules/  package-lock.json  package.json  packages/  tsconfig.base.json  turbo.json` + dotfiles.
- apps/: `api/  web/`
- packages/: `shared-types/`

- [ ] **Final 2: `npm run typecheck` passa**

Run: `npm run typecheck`
Expected: turbo reporta sucesso em todos os 3 workspaces.

- [ ] **Final 3: `npm run dev` sobe os dois apps em paralelo**

Run: `npm run dev`
Expected: turbo TUI mostra `web` em :3000 e `api` em :3001 simultaneamente, ambos prontos. Encerrar com Ctrl+C.

- [ ] **Final 4: Working tree limpo**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

- [ ] **Final 5: 5 commits na main, todos conventional**

Run: `git log --oneline`
Expected: 5 linhas, todas com prefixo conventional (`chore:`, `ci:`).

- [ ] **Final 6: Hooks ativos**

Run:

```bash
ls -la .husky/pre-commit .husky/commit-msg
```

Expected: ambos existem.

Test rápido — tentar commit com mensagem inválida (sem alteração real):

```bash
git commit --allow-empty -m "INVALID MESSAGE FORMAT"
```

Expected: hook rejeita.

Confirmar que hooks NÃO criaram commit indesejado:

```bash
git log --oneline | wc -l
```

Expected: ainda 5.

- [ ] **Final 7: Format + lint + typecheck + build passam**

Run:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run build
```

Expected: todos os 4 ✅. Build do `apps/web` gera `.next/`, build do `apps/api` gera `dist/`.

- [ ] **Final 8: CI verde no GitHub**

Run:

```bash
gh run list --limit 1
```

Expected: status `completed success` no último run de `CI`.

---

## Próximos passos (fora desse plano)

Decidir em conjunto com o usuário antes de iniciar:

1. **Frontend skeleton:** shadcn/ui init, NextAuth (Google + GitHub) com providers funcionais, next-themes, next-intl com pt-BR, tema do produto aplicado em `globals.css` + componentes base (header, theme-toggle).
2. **Backend skeleton:** Prisma init com schema inicial (User, Account, Session, Document, Message), módulos (auth, users, ocr, documents, chat), helmet + @nestjs/throttler + class-validator pipe global.
3. **Pipeline OCR + chat:** OpenAI SDK, vision call no upload, function calling com `get_full_document`, persistência de Document e Message.
4. **Sample data:** pasta `samples/` com NF-e/NFS-e/boletos anonimizados pra testar pipeline OCR.
5. **Deploy:** Dockerfiles (web e api), `railway.json`, configuração de Postgres + Volume no Railway, env vars, deploy inicial.
