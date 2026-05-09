# Fase 4 — Listagem + Download (Spec)

**Data:** 2026-05-09
**Fase anterior:** F3 (Chat, spec `2026-05-07-fase-3-chat.md` — versão corrigida em 2026-05-09).
**Próxima fase:** F5 (Finalização).

---

## 1. Objetivo

Entregar a última peça de produto do core do case Paggo:

- **Página `/documents`**: listagem de todos os documentos do usuário, ordem `updatedAt desc`, com badge de status, navegação para detalhe e ação de download por linha.
- **Botão `Download` na página `/documents/[id]`**: mesma ação, no header.
- **Endpoint `GET /api/v1/documents/:id/download`**: stream de **ZIP** com 3 arquivos: `original.<ext>`, `extracted-text.txt`, `chat-transcript.md`. Auth + ownership obrigatórios; 409 se `status !== READY`.
- **Topbar**: ativa item `Minhas notas` apontando para `/documents` (estava `aria-disabled` desde F1).
- **i18n**: namespace `documents` ganha as strings da listagem e do download.
- **Suite de testes** cobre ownership, geração do ZIP, sanitização de filename, throttle, e jornada E2E lista → detalhe → download.

Ao fim da F4 a app tem o ciclo completo do case: login → upload → OCR → chat (workspace e por doc) → listagem → download com transcript.

> **Origem do escopo.** O plano-mestre §132–142 (`2026-05-07-plano-detalhamento-specs.md`) descreve em alto nível. As decisões pendentes desse plano (formato do download, pendência do transcript, paginação, escopo da listagem, posicionamento do botão) foram fechadas no brainstorm de 2026-05-09 — registradas em §3 desta spec. O requisito do case Paggo ("Provide an option for users to download the uploaded documents with the appended extracted text and LLM interactions") foi a âncora do desenho.

---

## 2. Premissas (entregue por F0 + F0.5 + F1 + F2 + F3)

A F4 **não** instala/configura nada do que segue — assume tudo pronto:

- Monorepo Turborepo `apps/web` (Next.js 16, App Router) e `apps/api` (NestJS 11). Postgres 16 via docker-compose.
- Auth funcional: NextAuth + JWT validado no Nest. `JwtAuthGuard` global, `@CurrentUser()` injetando `req.user`. `@Public()` opt-out.
- Schema Prisma com `User` (F1), `Document` com `extractedText`, `summary`, `userId` (F2), e `ChatSession` com `documentId?` opcional + `@@unique([userId, documentId])` (F3 corrigida).
- `StorageModule` (F2) expõe `StorageService.openRead(storagePath): Readable` para ler do volume Railway.
- `ChatModule` (F3) já persiste mensagens nos dois modos. F4 lê via Prisma direto, **não** importa `ChatService`.
- shadcn/ui base portada em F0.5 (`Button`, `Badge`, `Card`, `Tooltip`, `sonner`, `Skeleton`, `DropdownMenu`).
- next-intl com namespaces F0.5–F3 já carregados.
- `V2Topbar` em `app/(authed)/layout.tsx` com item `Minhas notas` ainda `aria-disabled` — F4 ativa.
- `apiFetch(path, init, req?)` em `apps/web/lib/api.ts` (F1) injeta JWT como `Authorization: Bearer`.
- BFF pattern: cliente JS chama `app/api/*` do Next; nunca o Nest direto.
- Backend globals: `helmet`, `ThrottlerModule`, `ValidationPipe` global, CORS via `ALLOWED_ORIGINS`.
- `UserScopedThrottlerGuard` (F2) registrado como `APP_GUARD`.
- Deploy Railway: web + api + Postgres + volume no ar.

Se algum desses pontos não estiver pronto, **F4 está bloqueada** e o gap volta para a fase de origem. Em particular, a F3 corrigida (com `documentId` em `ChatSession` e persistência do chat-de-doc) é pré-requisito direto.

---

## 3. Decisões fechadas

| #   | Decisão                          | Escolha                                                                                                                                                                                                                                         |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Transcript no download           | Sim — chat-de-doc persiste (F3 corrigida) e F4 lê do DB. Origem: requisito Paggo "appended extracted text and LLM interactions".                                                                                                                |
| D2  | Formato do artefato              | **ZIP** com 3-4 arquivos: `original.<ext>` + `extracted-text.txt` + `narrative.txt` (se presente, F2.5) + `chat-transcript.md`. PDF único (combinando tudo) é polish — backlog F5.                                                              |
| D3  | Paginação de `/documents`        | **Sem paginação** na F4. Lista limita em `take: 100` por user. Cursor/offset entram no backlog se demanda surgir.                                                                                                                               |
| D4  | Filtros e busca                  | **Nenhum**. Lista crua ordenada por `updatedAt desc`. Filtro de status / busca por filename são backlog.                                                                                                                                        |
| D5  | Localização do botão download    | **Em ambos:** linha da lista (ação rápida) + header da página de detalhe (ação principal). Usa o mesmo componente `<DownloadButton />`.                                                                                                         |
| D6  | Botão quando `status !== READY`  | Disabled + tooltip explicativo ("Disponível quando a extração terminar"). Não tenta baixar.                                                                                                                                                     |
| D7  | Auth do download                 | Endpoint Nest **autenticado por JWT**, não signed URL. Volume é privado (montado só na API). Migração para R2/S3 + signed URL fica no backlog atrás da abstração `StorageService`.                                                              |
| D8  | Throttle do download             | Bucket dedicado `download` em `ThrottlerModule.forRoot`: 10/min por user. Reusa `UserScopedThrottlerGuard`.                                                                                                                                     |
| D9  | Streaming do ZIP                 | Server-side: `archiver` produz `Readable`, pipe direto na response. Cliente: `await res.blob()` (buffer integral) + `<a download>` programático. Streaming via Service Worker é backlog se necessário.                                          |
| D10 | Filename do ZIP                  | Sanitizado: `sanitizeFilenameForZip(doc.filename) + '.zip'`. Helper remove caracteres proibidos (Windows + path separators + control chars), normaliza acentos via NFKD para ASCII safe, fallback `'documento'`.                                |
| D11 | Idioma do transcript             | **pt-BR fixo** (cabeçalhos `## Você` / `## Assistente`). Geração assíncrona, gerado server-side, sem context de locale do request. Internacionalização é backlog.                                                                               |
| D12 | Mensagens TOOL no transcript     | Excluídas. Filtro `role !== 'TOOL'` na query, alinhado com F3 D17. Mantém transcript legível ao usuário sem expor round-trips de tool.                                                                                                          |
| D13 | Encoding do `extracted-text.txt` | UTF-8 com BOM (compatibilidade Windows/Excel). Vazio se `Document.extractedText === null`.                                                                                                                                                      |
| D14 | Compressão do ZIP                | `zlib level: 6` (default do `archiver`). Trade-off entre tempo de CPU e tamanho.                                                                                                                                                                |
| D15 | Erros mid-stream                 | `archive.on('error')` loga estruturado e propaga. Cliente vê download corrompido — toast genérico no `onerror` do hook. Pre-flight em D16 cobre o caminho mais comum.                                                                           |
| D16 | Pre-flight check                 | Antes de pipear o `archive`, valida: `doc` existe + ownership + `status === READY` + `storage.openRead` retorna stream sem lançar. Se falha, retorna 4xx/5xx **antes** de qualquer header de stream.                                            |
| D17 | Transcript vazio                 | Se a sessão não existe ou `messages.length === 0`, gera arquivo com header + linha "_Nenhuma conversa neste documento ainda._". ZIP mantém 3 arquivos sempre.                                                                                   |
| D18 | Layout da listagem               | Tabela sóbria desktop, cards mobile (responsive Tailwind). Cada linha: ícone do mime, filename truncado, badge de status, "há X tempo" (relative time pt-BR via `Intl`), botão download.                                                        |
| D19 | Refresh da lista                 | Hook `useDocumentsList` escuta `UPLOAD_QUEUED_EVENT` (já entregue pela PR de adaptive polling em `apps/web/components/features/active-uploads/events.ts`) — quando upload novo é enfileirado em outra aba/componente, força `router.refresh()`. |
| D20 | Empty state                      | Componente `<EmptyListState />` com call-to-action "Faça seu primeiro upload" → linka para `/`.                                                                                                                                                 |

---

## 4. Schema Prisma (delta da F4)

**Nenhum.** F4 só consome o schema entregue por F2 + F3-corrigida. Sem migration nova.

A query principal do download depende de:

```prisma
// já entregue por F3 corrigida
ChatSession {
  documentId String?
  @@unique([userId, documentId])
}
```

Que permite `findFirst({ where: { userId, documentId } })` para localizar a sessão associada ao doc.

---

## 5. Arquitetura e fluxo

### 5.1 Fluxo ponta a ponta — listagem

```
[Browser /documents]            [Next.js apps/web]              [Nest apps/api]                [Postgres]
   │                                  │                                │                            │
   │── carrega página ───────────────▶│ DocumentsIndex (RSC)            │                            │
   │                                  │  apiFetch('/api/v1/documents?limit=100')                   │
   │                                  │   → Bearer JWT                  │                            │
   │                                  │                                │ JwtAuthGuard               │
   │                                  │                                │ DocumentsController.list:  │
   │                                  │                                │  prisma.document.findMany( │
   │                                  │                                │    where: { userId },      │
   │                                  │                                │    orderBy: updatedAt desc,│
   │                                  │                                │    take: 100               │
   │                                  │                                │  ) ──────────────────────▶│
   │                                  │ ◀── 200 [...docs]              │                            │
   │                                  │ render <DocumentsList>          │                            │
   │                                  │                                │                            │
   │── click [↓] em uma linha ───────▶│ useDocumentDownload.download(id, name)                     │
   │                                  │  fetch /api/documents/:id/download                          │
   │                                  │                                │ buildArchive (§5.3)        │
   │                                  │                                │  ownership + status check ▶│
   │                                  │                                │  load chatSession messages▶│
   │                                  │                                │  archive.append × 3        │
   │                                  │ ◀── stream zip ────────────────│                            │
   │                                  │ res.blob() → <a download> click                            │
```

### 5.2 Módulo no Nest

```
apps/api/src/
├── download/                      # novo módulo F4
│   ├── download.module.ts
│   ├── download.controller.ts     # GET /api/v1/documents/:id/download
│   ├── download.service.ts        # buildArchive, ownership, pre-flight
│   └── helpers/
│       ├── chat-transcript.ts     # buildChatTranscript(doc, session) → string
│       ├── extracted-text-file.ts # buildExtractedTextFile(text) → Buffer (BOM + UTF-8)
│       ├── sanitize-filename.ts   # sanitizeFilenameForZip(name)
│       └── mime-to-ext.ts         # 'application/pdf' → 'pdf', etc.
├── documents/                     # já existe (F2) — F4 não toca
├── chat/                          # já existe (F3) — F4 não toca
├── ocr/                           # já existe (F2)
├── storage/                       # já existe (F2)
├── auth/                          # já existe (F1)
└── prisma/                        # já existe (F0.5)
```

**Por que módulo separado?** Single responsibility — `download` cuida da composição do artefato (sanitização, transcript, ZIP). `documents` segue só com CRUD/listagem. Mantém `DocumentsService` enxuto. Padrão idêntico ao que F3 fez separando `chat` de `ocr`/`documents`.

**Imports do `DownloadModule`:** `PrismaModule`, `StorageModule`. Não importa `ChatModule` nem `DocumentsModule` — operações são read-only e usam Prisma diretamente.

### 5.3 `DownloadService.buildArchive`

```ts
async buildArchive(userId: string, documentId: string): Promise<{ stream: Readable; filename: string }> {
  // Pre-flight: ownership + status
  const doc = await this.prisma.document.findFirst({
    where: { id: documentId, userId },
    select: {
      id: true, filename: true, mime: true,
      storagePath: true, status: true, extractedText: true,
    },
  });
  if (!doc) throw new NotFoundException();
  if (doc.status !== DocumentStatus.READY) {
    throw new ConflictException({ code: 'document_not_ready' });
  }

  // Carrega chat session (se existir) — antes de abrir stream do storage,
  // pra que uma falha de DB não vaze um stream de arquivo.
  const session = await this.prisma.chatSession.findFirst({
    where: { userId, documentId: doc.id },
    include: {
      messages: {
        where: { role: { not: ChatRole.TOOL } },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });

  // Pré-renderiza arquivos in-memory (texto + transcript) antes de tocar o storage —
  // se eles falham, ainda podemos abortar com 5xx limpo.
  const extractedBuf = buildExtractedTextFile(doc.extractedText);
  const transcriptStr = buildChatTranscript(doc, session);

  // Pre-flight do storage: confirma que original ainda está acessível.
  // Esta é a última operação async antes de começar a streamar.
  let originalStream: Readable;
  try {
    originalStream = await this.storage.openRead(doc.storagePath);
  } catch (err) {
    this.logger.error({ event: 'download.storage_failed', documentId, err });
    throw new ServiceUnavailableException({ code: 'storage_unavailable' });
  }

  const archive = archiver('zip', { zlib: { level: 6 } });

  // Se o archiver lançar antes do append, fecha o stream original explicitamente
  // pra evitar vazamento. Após `archive.append(originalStream, ...)`, o archiver
  // assume responsabilidade pelo lifecycle do stream.
  let originalConsumed = false;

  archive.on('warning', (err) => {
    if (err.code !== 'ENOENT') this.logger.warn({ event: 'download.zip_warning', err });
  });
  archive.on('error', (err) => {
    this.logger.error({ event: 'download.zip_error', documentId, err });
    // Propaga — quem está no pipe (controller → res) detecta e encerra a conexão
    throw err;
  });
  archive.on('end', () => {
    this.logger.log({
      event: 'download.completed',
      userId, documentId, bytes: archive.pointer(),
    });
  });

  try {
    // 1) Original — archiver passa a possuir o stream
    const ext = mimeToExt(doc.mime);
    archive.append(originalStream, { name: `original.${ext}` });
    originalConsumed = true;

    // 2) Texto extraído
    archive.append(extractedBuf, { name: 'extracted-text.txt' });

    // 3) Narrative (F2.5) — presente apenas em docs processados após F2.5
    if (doc.summary?.narrative) {
      archive.append(doc.summary.narrative, { name: 'narrative.txt' });
    }

    // 4) Transcript do chat
    archive.append(transcriptStr, { name: 'chat-transcript.md' });

    archive.finalize();
  } catch (err) {
    if (!originalConsumed) originalStream.destroy();
    throw err;
  }

  return {
    stream: archive,
    filename: `${sanitizeFilenameForZip(doc.filename)}.zip`,
  };
}
```

**Notas de design:**

1. **`select` explícito** em ambas as queries. `extractedText` é pesado e nunca deve aparecer em logs — defesa proativa.
2. **Pre-flight do storage** lança `ServiceUnavailableException` antes de qualquer header sair. Cliente recebe 503 com body, em vez de download corrompido (R2 mitigado).
3. **`archive` é o próprio `Readable` retornado.** `archiver` produz stream nativo — pipe direto sem buffer intermediário. Documentos grandes não estouram memória do Node.
4. **`archive.on('end')`** loga bytes streamados — permite observabilidade futura sem custo agora.
5. **`archive.on('error')`** propaga; o `pipe(res)` do controller detecta e encerra a conexão. Cliente vê EOF prematuro — toast genérico cobre. Não tentamos "recuperar" mid-stream.

### 5.4 `DownloadController`

```ts
@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard)
export class DownloadController {
  constructor(private readonly download: DownloadService) {}

  @Get(':id/download')
  @Throttle({ download: { ttl: 60_000, limit: 10 } })
  async downloadDocument(
    @CurrentUser() user: { id: string },
    @Param('id') documentId: string,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.download.buildArchive(user.id, documentId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');

    stream.pipe(res);
  }
}
```

Controller é **dumb** — só seta headers e pipe. Toda lógica vive no service. Facilita teste unitário do service sem subir HTTP.

### 5.5 Helpers

#### `mimeToExt`

```ts
const MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
export function mimeToExt(mime: string): string {
  return MAP[mime] ?? 'bin';
}
```

Mapa fechado. Mime fora do mapa cai em `bin` — não tenta adivinhar. Em F2 o upload já valida magic bytes para esses três tipos; outros nunca chegam aqui.

#### `buildExtractedTextFile`

```ts
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
export function buildExtractedTextFile(text: string | null): Buffer {
  const body = Buffer.from(text ?? '', 'utf8');
  return Buffer.concat([BOM, body]);
}
```

BOM UTF-8 (compat Windows/Excel). Se `extractedText === null` (não deveria acontecer com `status === READY`, mas defensivo), gera arquivo só com o BOM.

#### `buildChatTranscript`

```ts
export function buildChatTranscript(
  doc: { id: string; filename: string },
  session: {
    messages: Array<{ role: ChatRole; content: string; createdAt: Date }>;
  } | null,
): string {
  const count = session?.messages.length ?? 0;
  const header = [
    `# Transcript da conversa — ${doc.filename}`,
    '',
    `_Gerado em: ${new Date().toISOString()}_`,
    `_Documento: ${doc.filename} (${doc.id})_`,
    `_Total de mensagens: ${count}_`,
    '',
    '---',
    '',
  ].join('\n');

  if (count === 0) {
    return header + '_Nenhuma conversa neste documento ainda._\n';
  }

  const body = session!.messages
    .map((m) => {
      const role = m.role === ChatRole.USER ? 'Você' : 'Assistente';
      return `## ${role}\n\n${m.content}\n`;
    })
    .join('\n');

  return header + body;
}
```

Markdown plano. Sem HTML — torna o arquivo legível em qualquer text editor e renderizável visualmente em qualquer Markdown viewer. Strings de role em pt-BR fixo (D11).

#### `sanitizeFilenameForZip`

```ts
const FORBIDDEN = /[\x00-\x1f\x7f"\\/:*?<>|]/g;

export function sanitizeFilenameForZip(name: string): string {
  // 1) Remove extensão
  const base = name.replace(/\.[^.]+$/, '');
  // 2) Normaliza acentos: NFKD + remove combining marks
  const ascii = base.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  // 3) Remove caracteres proibidos
  const cleaned = ascii.replace(FORBIDDEN, '_').trim();
  // 4) Limita 100 chars
  const truncated = cleaned.slice(0, 100);
  return truncated || 'documento';
}
```

**Por que essa lista?** Caracteres rejeitados pelo Windows em filenames + `\0` que pode injetar em headers HTTP + path separators que poderiam confundir extratores zip. NFKD + remoção de combining marks deixa o `Content-Disposition` ASCII-safe sem perder legibilidade ("Pão de Açúcar.pdf" vira "Pao de Acucar"). Truncate em 100 chars cobre limites de filesystem antigos. Fallback `'documento'` para o caso patológico de filename inteiro inválido.

---

## 6. Implementação — `apps/api`

### 6.1 Dependências a adicionar

```json
{
  "dependencies": {
    "archiver": "^7.0.1",
    "@types/archiver": "^6.0.2"
  }
}
```

### 6.2 Wiring no `AppModule`

```ts
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60_000, limit: 60 },
  { name: 'upload',   ttl: 60_000, limit: 5 },
  { name: 'ocr',      ttl: 60_000, limit: 3 },
  { name: 'chat',     ttl: 60_000, limit: 15 },   // F3
  { name: 'download', ttl: 60_000, limit: 10 },   // F4 adiciona
]),
// ...
imports: [
  // ...F0.5/F1/F2/F3...
  DownloadModule,
],
```

### 6.3 `DownloadModule`

```ts
@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}
```

### 6.4 Códigos de erro

- `401` — Bearer ausente/inválido (handler do `JwtAuthGuard`).
- `404` — doc inexistente ou não pertence ao user (mesma resposta para evitar enumeration).
- `409` — `{ code: 'document_not_ready' }` quando `status !== READY`.
- `429` — throttle excedido.
- `503` — `{ code: 'storage_unavailable' }` no pre-flight do storage.

### 6.5 Logs

**Logado:** `event: 'download.requested'`, `'download.completed'`, `'download.zip_warning'`, `'download.zip_error'`, `'download.storage_failed'`. Campos: `userId`, `documentId`, `bytes` (no completed). **Nunca logado:** `extractedText`, `content` de mensagens, `filename` (PII potencial).

---

## 7. Implementação — `apps/web`

### 7.1 Dependências a adicionar

Nenhuma. Reusa `sonner`, `lucide-react`, `next-intl`, shadcn primitivos da F0.5–F3.

### 7.2 Estrutura `features/`

```
apps/web/components/features/
├── documents-list/
│   ├── documents-list.tsx       # presentation: tabela/cards de docs
│   ├── document-row.tsx         # 1 linha: filename, status badge, updatedAt, ação download
│   ├── empty-list-state.tsx     # CTA para upload quando lista vazia
│   └── use-documents-list.ts    # hook fetch + reage a UPLOAD_QUEUED_EVENT
└── document-download/
    ├── download-button.tsx      # componente reusado em lista E detalhe
    └── use-document-download.ts # hook: dispara fetch ZIP, cria blob URL, click + cleanup
```

### 7.3 `useDocumentDownload`

```ts
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function useDocumentDownload() {
  const [pending, setPending] = useState<Set<string>>(new Set());
  const t = useTranslations('documents.download');

  const download = useCallback(
    async (documentId: string, suggestedFilename: string) => {
      if (pending.has(documentId)) return;
      setPending((prev) => new Set(prev).add(documentId));

      try {
        const res = await fetch(`/api/documents/${documentId}/download`);
        if (res.status === 409) {
          toast.error(t('error_not_ready'));
          return;
        }
        if (!res.ok) {
          toast.error(t('error_generic'));
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${suggestedFilename}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        toast.error(t('error_generic'));
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(documentId);
          return next;
        });
      }
    },
    [pending, t],
  );

  return { download, isPending: (id: string) => pending.has(id) };
}
```

**Notas de design:**

- `Set<string>` de pending permite múltiplos downloads simultâneos com granularidade por id (lista pode ter várias linhas baixando).
- `await res.blob()` (buffer integral) é OK para ZIPs até ~50 MB típicos. Streaming via Service Worker é backlog se aparecer doc grande.
- `<a download>` programático é o padrão browser canônico para forçar "Save As".
- `URL.revokeObjectURL` balanceado — sem isso o blob fica no heap até a aba fechar.

### 7.4 `DownloadButton`

```tsx
'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { useDocumentDownload } from './use-document-download';

type Props = {
  documentId: string;
  filename: string;
  status: 'QUEUED' | 'OCR_RUNNING' | 'READY' | 'FAILED';
  variant?: 'default' | 'icon';
};

export function DownloadButton({ documentId, filename, status, variant = 'default' }: Props) {
  const t = useTranslations('documents.download');
  const { download, isPending } = useDocumentDownload();
  const disabled = status !== 'READY' || isPending(documentId);

  const button = (
    <Button
      variant={variant === 'icon' ? 'ghost' : 'default'}
      size={variant === 'icon' ? 'icon' : 'sm'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        void download(documentId, filename);
      }}
      aria-label={t('button')}
    >
      <Download className="h-4 w-4" />
      {variant === 'default' && <span className="ml-2">{t('button')}</span>}
    </Button>
  );

  if (status !== 'READY') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{t('disabled_tooltip')}</TooltipContent>
      </Tooltip>
    );
  }
  return button;
}
```

**`e.stopPropagation()`** — quando o botão estiver dentro de uma linha clicável (lista navegando para detail), impede que o click no botão também navegue.

### 7.5 BFF route handler

```ts
// apps/web/app/api/documents/[id]/download/route.ts
import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/api/v1/documents/${id}/download`, {}, req);

  if (!res.ok || !res.body) {
    // Erro: passa response do Nest direto pro cliente (com body de erro JSON)
    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  }

  // Sucesso: pass-through do stream binário, preserva Content-Disposition
  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/zip',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
      'Cache-Control': 'no-store',
    },
  });
}
```

### 7.6 Página `/documents`

```tsx
// apps/web/app/(authed)/documents/page.tsx
import { apiFetch } from '@/lib/api';
import type { DocumentSummary } from '@invoices-ocr/shared-types';
import { DocumentsList } from '@/components/features/documents-list/documents-list';
import { EmptyListState } from '@/components/features/documents-list/empty-list-state';

export default async function DocumentsIndex() {
  const res = await apiFetch('/api/v1/documents?limit=100');
  const docs = (res.ok ? await res.json() : []) as DocumentSummary[];
  if (docs.length === 0) return <EmptyListState />;
  return <DocumentsList initialDocs={docs} />;
}
```

`DocumentsList` é Client Component que recebe `initialDocs` (do RSC) e usa `useDocumentsList` para reagir ao evento `UPLOAD_QUEUED_EVENT` (D19).

### 7.7 `DocumentRow` — UX

```
┌─────────────────────────────────────────────────────────────────┐
│ [📄] minha-nota.pdf            [READY]    há 2 min      [↓]    │
└─────────────────────────────────────────────────────────────────┘
```

- Click na linha (exceto botão) → `router.push('/documents/' + id)`
- Click no botão → `download(id, filename)` direto, com `stopPropagation`
- Status badges: cores OKLCH respeitando paleta da F0.5
- "há X tempo" via `Intl.RelativeTimeFormat` em pt-BR, atualizado client-side

### 7.8 Botão na página de detalhe

`apps/web/components/features/document-detail/document-detail.tsx` — F4 adiciona `<DownloadButton documentId={doc.id} filename={doc.filename} status={doc.status} variant="default" />` no header, ao lado do filename. Sem outras mudanças nessa página (a tab `Conversa` continua sob domínio da F3).

### 7.9 Topbar — ativar `Minhas notas`

`apps/web/components/layout/topbar.tsx`: troca o item `list` de `enabled: false, href: '#'` para `enabled: true, href: '/documents'`. Sem outras mudanças.

### 7.10 i18n — namespace `documents`

Adicionar em `apps/web/messages/pt-BR.json`:

```json
{
  "documents": {
    "list": {
      "title": "Minhas notas",
      "subtitle": "Documentos enviados, ordenados pelos mais recentes.",
      "empty_title": "Você ainda não enviou nenhum documento",
      "empty_cta": "Fazer primeiro upload",
      "status": {
        "QUEUED": "Na fila",
        "OCR_RUNNING": "Processando",
        "READY": "Pronto",
        "FAILED": "Falhou"
      },
      "size": "{size, plural, =0 {vazio} other {{size, number} bytes}}",
      "updated_at": "atualizado {when}"
    },
    "download": {
      "button": "Download",
      "disabled_tooltip": "Disponível quando a extração terminar",
      "error_not_ready": "Documento ainda não está pronto",
      "error_generic": "Não foi possível baixar agora. Tente de novo."
    }
  }
}
```

> `topbar.nav.list` ("Minhas notas") já existe no `pt-BR.json` desde F0.5. F4 não mexe nas strings do topbar — apenas ativa o link no `topbar.tsx`.

---

## 8. Variáveis de ambiente

Nenhuma adicionada. F4 reusa `DATABASE_URL`, `STORAGE_PATH`, `ALLOWED_ORIGINS`. Throttle bucket `download` é em código, não env.

---

## 9. Testes

Foco: 100% dos fluxos críticos do backend (ownership, transcript, sanitização, throttle) + jornada E2E. Coverage global continua no backlog (CLAUDE.md).

### 9.1 Unit — Nest

- `DownloadService.buildArchive`:
  - Ownership: doc de outro user → `NotFoundException`.
  - Status `QUEUED`/`OCR_RUNNING`/`FAILED` → `ConflictException { code: 'document_not_ready' }`.
  - Storage `openRead` falha → `ServiceUnavailableException { code: 'storage_unavailable' }`, sem stream.
  - Status `READY` sem chat session → ZIP com 3 entradas; `chat-transcript.md` contém `_Nenhuma conversa..._`.
  - Status `READY` com chat (3 USER + 3 ASSISTANT + 1 TOOL) → transcript inclui apenas USER e ASSISTANT, ordem `createdAt asc`.
  - Mock do `StorageService.openRead` retorna `Readable` controlado.
- `chat-transcript.ts`:
  - Header inclui filename, id, count.
  - Sessão `null` vs vazia geram o mesmo body de "_Nenhuma conversa..._".
  - Sessão cheia: cabeçalhos `## Você` / `## Assistente` corretos, conteúdo preservado.
- `sanitize-filename.ts`:
  - Remove `*`, `?`, `:`, control chars, path separators.
  - "Pão de Açúcar.pdf" → "Pao de Acucar".
  - String só com proibidos → `'documento'`.
  - Truncate em 100 chars.
- `extracted-text-file.ts`:
  - BOM presente nos 3 primeiros bytes.
  - `null` vira só BOM.
- `mime-to-ext.ts`: 3 mimes mapeados, qualquer outro → `'bin'`.

### 9.2 Integração — Nest

- `GET /v1/documents/:id/download`:
  - 401 sem token.
  - 404 doc de outro user.
  - 404 doc inexistente.
  - 409 doc `QUEUED` / `OCR_RUNNING` / `FAILED`.
  - 200 doc `READY`: response tem `Content-Type: application/zip`, `Content-Disposition: attachment; filename="<sanitized>.zip"`, body é ZIP válido (open com `unzipper` no teste e listar entradas: `original.pdf`, `extracted-text.txt`, `chat-transcript.md`).
  - 429 no 11º request em 1 minuto.
  - Doc `READY` com chat existente: `chat-transcript.md` contém as mensagens persistidas.
  - Doc `READY` sem chat: `chat-transcript.md` contém o placeholder.

### 9.3 Unit — Web (Vitest + jsdom)

- `useDocumentDownload`:
  - 409 → toast `error_not_ready`, sem clicar.
  - !ok genérico → toast `error_generic`, sem clicar.
  - Sucesso → `<a>` com `download` attr é clicado, blob URL é revogada.
  - Duas chamadas para o mesmo `documentId` em sequência rápida → segunda é no-op (`pending` already has).
  - Chamadas para ids diferentes em paralelo → ambas progridem.
- `DownloadButton`:
  - `status !== 'READY'` → `disabled` + tooltip visível com `disabled_tooltip`.
  - `status === 'READY'` + click → invoca `download` do hook.
  - Click propagation: usa `stopPropagation` (verificar via spy no `MouseEvent.stopPropagation`).
- `DocumentRow`:
  - Click na linha (não botão) → `router.push('/documents/<id>')`.
  - Click no botão → não navega.
  - Status `QUEUED` → botão disabled.
- `useDocumentsList`:
  - Recebe `initialDocs`, hidrata state.
  - `dispatchEvent(UPLOAD_QUEUED_EVENT)` → triggers `router.refresh()` (verificar via mock).

### 9.4 E2E — Playwright

- **Jornada (Lista + Download por linha):** login → upload mock → aguardar `READY` (via `ActiveUploadsProvider` toast `READY`) → topbar `Minhas notas` → assertar a linha do doc na lista → click no botão `↓` → `page.waitForEvent('download')` → assertar filename termina em `.zip`.
- **Jornada (Download na detail):** mesma setup → click na linha (não no botão) → `/documents/[id]` → click no botão `Download` no header → `page.waitForEvent('download')` → assertar filename.
- **Jornada (Disabled durante OCR):** upload → antes do `READY`, navegar para `/documents` → assertar botão `[↓]` da linha disabled + tooltip aparece on hover.

Override por env: testes E2E rodam com `LLM_PROVIDER=mock` + `OCR_PROVIDER=mock`.

---

## 10. Riscos

| #   | Risco                                                                                     | Mitigação                                                                                                                                                                                | Fallback                                                           |
| --- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| R1  | ZIP grande (~10 MB original + transcript longo) trava memória do browser via `res.blob()` | Limite de upload F2 já é 10 MB; transcript dificilmente passa de 1 MB                                                                                                                    | Se aparecer doc grande, F5 migra para streaming via Service Worker |
| R2  | `archiver` lança erro mid-stream após response 200                                        | Pre-flight (D16) cobre os casos comuns (`storage_unavailable`); raros casos remanescentes propagam e cliente vê EOF                                                                      | Toast genérico `error_generic`; usuário tenta de novo              |
| R3  | Filename Unicode quebra `Content-Disposition` em browsers antigos                         | `sanitizeFilenameForZip` normaliza NFKD + remove combining marks → ASCII safe. O atributo `download` no `<a>` cliente também passa o filename como hint                                  | Filename vira algo legível mesmo sem UTF-8                         |
| R4  | Throttle 10/min insuficiente em demos (revisor da Paggo testando rapido)                  | 10/min por user é folgado para uso humano normal; 503 vira mensagem clara                                                                                                                | Aumentar para 20/min via env se necessário; backlog                |
| R5  | Race entre mudança de `status` (OCR_RUNNING → READY) e click do botão                     | Frontend não re-checa status antes de baixar — backend já valida e retorna 409                                                                                                           | Toast `error_not_ready` instrui usuário                            |
| R6  | F4 desconhece eventos de F2 (OCR concluído invalidando cache)                             | Sem cache no F4 — sempre lê do DB no momento do download                                                                                                                                 | N/A                                                                |
| R7  | Transcript em pt-BR fixo desagrada quando habilitarmos en-US (D11)                        | Documentado no spec; backlog: parametrizar via header `Accept-Language` ou query param                                                                                                   | F-futura                                                           |
| R8  | Pre-flight do storage abre stream que precisa ser fechado se algo falhar adiante          | Ordem em `buildArchive` posiciona `openRead` por último entre as operações async; flag `originalConsumed` + try/catch chamam `originalStream.destroy()` se algo lançar antes do `append` | Logado como `download.zip_error` para debug                        |
| R9  | `apiFetch` força `Content-Type: application/json` em request — quebra request multipart?  | Download é GET sem body; força de Content-Type não tem efeito em GET sem body                                                                                                            | N/A                                                                |
| R10 | ZIP corrompido devido a mid-stream error chega ao usuário e ele acha que é bug do app     | Cliente exibe toast pós-erro; pre-flight catch dos casos comuns; `archive.on('end')` log permite diagnóstico                                                                             | F5 considera adicionar checksum em header pra cliente verificar    |

---

## 11. Definition of Done

- [ ] Spec da F3 corrigida + commit antes da F4 (delta documentado em `2026-05-07-fase-3-chat.md`).
- [ ] `archiver` + `@types/archiver` instalados em `apps/api/package.json`.
- [ ] `DownloadModule` registrado em `AppModule.imports`.
- [ ] Throttle bucket `download` adicionado em `ThrottlerModule.forRoot`.
- [ ] Endpoint `GET /api/v1/documents/:id/download` retorna ZIP válido com 3 arquivos (verificado abrindo manualmente).
- [ ] Ownership check: user B não baixa doc de A (404).
- [ ] Throttle 10/min testado manualmente (11º request → 429).
- [ ] Sanitização: filename `"../../etc/passwd.pdf"` vira algo seguro; filename com acentos abre em Windows sem `?`.
- [ ] Página `/documents` lista, ordena por `updatedAt desc`, exibe badges de status, navega para detalhe.
- [ ] Botão download na linha da lista: disabled + tooltip quando `status !== READY`; funcional quando `READY`.
- [ ] Botão download no header da página de detalhe: idem.
- [ ] Topbar `Minhas notas` ativo apontando para `/documents`.
- [ ] Empty state aparece quando user não tem docs.
- [ ] i18n: nenhuma string hardcoded em pt-BR no novo código (grep manual).
- [ ] Logs verificados: nenhum `extractedText`, nenhum `content` de mensagens, nenhum `filename` na saída do api.
- [ ] Suite Vitest verde (`apps/web`).
- [ ] Suite Jest verde (`apps/api`).
- [ ] Suite Playwright verde (jornadas da §9.4).
- [ ] CI verde no PR.
- [ ] Smoke deploy: criar conta em prod, upload, OCR, chat, click download — abrir ZIP e ver os 3 arquivos com conteúdo correto.

---

## 12. O que NÃO entra na F4

Backlog explícito — não implementar antes do core fechar:

- **PDF único combinando original + texto + transcript.** Polish; F5 ou backlog Paggo.
- **Paginação real** (cursor/offset). Lista limitada em 100 docs cobre o demo.
- **Filtros por status, busca por filename.** Backlog F5.
- **Bulk download** (zip de N docs selecionados). Backlog.
- **Re-tentativa de OCR pela linha da lista.** Backlog F5.
- **Streaming via Service Worker** para ZIPs grandes. Backlog.
- **Internacionalização do transcript** (Accept-Language). Backlog.
- **Signed URL via R2/S3.** Volume Railway é o storage atual; a interface `StorageService` (F2) já abstrai a troca.
- **Checksum / verificação de integridade do ZIP no cliente.** Backlog.
- **Rate-limit per-document** (mais granular que per-user). Backlog.
- **Audit log** (quem baixou, quando, qual doc). Backlog spec Paggo.

---

## Emendas F2.5 (2026-05-09)

A F2.5 adiciona `summary.narrative` ao schema OCR. O download ZIP deve incluí-lo como arquivo adicional.

### Conteúdo do ZIP (atualizado)

| Arquivo              | Origem                                | Condição                             |
| -------------------- | ------------------------------------- | ------------------------------------ |
| `original.<ext>`     | Volume Railway                        | Sempre                               |
| `extracted-text.txt` | `Document.extractedText` (UTF-8 BOM)  | Sempre (vazio se null)               |
| `narrative.txt`      | `Document.summary?.narrative` (UTF-8) | Somente se `narrative` existir       |
| `chat-transcript.md` | Mensagens `ChatSession` (role ≠ TOOL) | Sempre (placeholder se sem conversa) |

A decisão D2 muda de "3 arquivos" para "3 ou 4 arquivos". O `narrative.txt` é opcional porque docs processados antes da F2.5 não têm o campo.

### Snippet — `download.service.ts`

```ts
// após append de extracted-text.txt:
if (doc.summary?.narrative) {
  archive.append(doc.summary.narrative, { name: 'narrative.txt' });
}
```

Nenhuma outra mudança necessária na F4.

---

**Fim da spec F4.**
