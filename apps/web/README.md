# @invoices-ocr/web

Frontend Next.js 16 do case técnico de OCR — OCR + LLM chat sobre invoices.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- shadcn/ui + Radix UI
- next-auth (Google + GitHub OAuth)
- next-themes (dark default)
- next-intl (pt-BR)
- react-dropzone
- react-markdown + rehype-sanitize
- sonner (toasts)
- recharts (gráficos do dashboard)

## Estrutura

```
app/
├── (authed)/           # rotas protegidas (middleware redirect)
│   ├── page.tsx        # home — upload de documentos
│   ├── documents/      # listagem + detalhe + download
│   ├── chat/           # chat workspace (sidebar + painel)
│   └── admin/          # painel admin (ADMIN only)
├── login/page.tsx      # tela de login OAuth
├── api/                # BFF route handlers (proxy pra API Nest)
│   ├── upload/
│   ├── documents/
│   ├── chat/
│   └── auth/[...nextauth]/
├── layout.tsx          # root layout (fonts, providers)
└── globals.css         # paleta OKLCH Invoice OCR + tokens Tailwind

components/
├── ui/                 # primitivos shadcn
├── layout/             # topbar, logo, user-menu, nav-links
└── features/
    ├── document-upload/
    ├── active-uploads/
    ├── document-detail/
    ├── document-download/
    ├── documents-list/
    ├── chat/
    └── benchmark/

lib/
├── auth.ts             # next-auth config (providers, callbacks)
├── api.ts              # helpers fetch server-side com Bearer JWT
├── prisma.ts           # Prisma client singleton (para callbacks auth)
└── env.ts              # validação zod de envs

messages/
└── pt-BR.json          # todas as strings de UI (i18n)
```

## Testes

```bash
npm run test        # unit + integration (Vitest + Testing Library, 28+ testes)
npm run test:e2e    # E2E (Playwright)
```

Para rodar um único teste:

```bash
cd apps/web && npx vitest run chat-panel
```

## i18n

Todas as strings de UI estão em `messages/pt-BR.json`. Não hardcodar texto em componentes — sempre usar `t('key')` do `next-intl`.

## Auth

NextAuth v4 com JWT strategy. O web faz upsert do `User` no Postgres via Prisma no callback `signIn`. O token JWT é compartilhado com o NestJS (mesmo `NEXTAUTH_SECRET`), que valida via `passport-jwt`.
