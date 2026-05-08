# Handoff: Invoices App — telas de OCR + Chat

## Overview

Aplicação web para upload de notas fiscais brasileiras (NF-e / NFS-e), extração via OCR (GPT-4o vision) e conversa com LLM sobre os dados extraídos. Este pacote contém **mockups de alta fidelidade** das 5 telas principais, alinhados à spec do case.

## About the Design Files

Os arquivos neste bundle são **referências de design feitas em HTML/JSX inline** — protótipos mostrando look-and-feel e comportamento pretendidos. **Não são código de produção para colar.** A tarefa é **recriar essas telas** no ambiente alvo (Next.js App Router + shadcn/ui + Tailwind, conforme spec) usando os padrões estabelecidos do codebase.

Como os mockups foram escritos com inline styles e primitives caseiros para iterar rápido, ao portar você deve:

- Substituir cada primitive caseiro (`Button`, `Input`, `Badge`, `Card`, `Tabs`, `Avatar`, `Separator`, `Progress`) pelo componente shadcn equivalente.
- Mover todos os tokens de cor para `globals.css` (já fornecido em `reference/globals.css`).
- Quebrar cada tela em `app/<route>/page.tsx` + componentes `features/<feature>/`.

## Fidelity

**High-fidelity.** Cores, tipografia, espaçamentos, hierarquia e estados estão finalizados. Use os valores hex/oklch do `tokens.css` e `globals.css` como verdade.

## Telas

As 5 telas estão em `hifi-v2.jsx`, exportadas como componentes nomeados:

| Componente     | Rota sugerida | Propósito                                                                       |
| -------------- | ------------- | ------------------------------------------------------------------------------- |
| `HifiV2Login`  | `/login`      | OAuth Google + GitHub                                                           |
| `HifiV2Upload` | `/` (home)    | Página inicial — upload de notas, com progresso e steps                         |
| `HifiV2List`   | `/notas`      | Lista de notas processadas, com tabs por tipo, busca, filtros                   |
| `HifiV2Detail` | `/notas/[id]` | Detalhe de uma nota: viewer com bbox overlay + chat por nota + campos extraídos |
| `HifiV2Chat`   | `/chat/[id]`  | Chat multi-nota, com sidebar de contexto editável                               |

### 01 · Login (`HifiV2Login`)

**Layout:** split 1.15fr / 1fr.

- **Esquerda:** brand presence — logo no topo, headline editorial em Instrument Serif italic 92px (`Notas fiscais, conversáveis.`), subtítulo 14px com até 420px de largura, três check-marks (NF-e modelo 55, NFS-e municipal, Boletos), e um meta-rail no rodapé com `StatusDot` verde + texto (Sistema operacional, LGPD compliant, SOC 2 Type II).
- **Direita:** card de auth — link "Solicitar acesso" no topo, headline 24px ("Entrar"), subtítulo 13px, dois botões SSO em variant `secondary` size `lg` (Google, GitHub) com gap 10px entre eles, divider, footer com Termos/Privacidade.
- **Footer global da coluna direita:** © 2025 Invoices · Status · Docs.

### 02 · Início / Upload (`HifiV2Upload`)

- Topbar fixo, breadcrumb `Início › Nova nota`.
- Headline + subtítulo em Instrument Serif italic.
- **Dropzone:** border tracejado `1px dashed var(--v2-line-strong)`, radius 10px, padding generoso, ícone de upload, copy "Arraste arquivos ou clique para selecionar" + helper "PDF, JPG, PNG até 10MB".
- **Card de arquivo em processamento:** filename + tipo + tamanho + `Progress` + ladder horizontal de 4 steps (Upload → OCR → Estrutura → Pronta) com `Icon name="check"` para steps concluídos.
- Rate limit inferido da spec: 5 uploads/min e 3 OCR/min — exibir helper text quando próximo do limite.

### 03 · Minhas notas (`HifiV2List`)

- Page header: "Minhas notas" h1 22px, subtítulo, botão primary "Nova nota" à direita.
- **Toolbar:** Tabs (Todas / NF-e / NFS-e / Pendentes) com count, busca com `⌘K` shortcut, botão `Filter`.
- **Tabela:** colunas Tipo (Badge), Número (mono), Emissor, CNPJ (mono), Valor (mono, tabular-nums, right-align), Status (`Badge` com `StatusDot`), Data (relativa: "há 12min"), kebab.
- Hover de linha: `background: var(--v2-surface-2)`.
- **Footer:** pagination + total de itens.

### 04 · Detalhe da nota (`HifiV2Detail`) — **a tela central**

- **Page header:** breadcrumb (`← Minhas notas › NF-e 0023117`), depois numa linha: `NF-e nº 0023117` + `Badge success "Pronta"` + emissor + valor + data + ações (`Exportar`, kebab).
- **Grid principal:** `1fr 300px` (conteúdo + rail de campos).
- **Coluna esquerda (vertical):**
  - **Top 44%:** viewer da nota com `InvoiceDoc` (DANFE renderizada). Overlay de bboxes — coordenadas em `INVOICE_BBOX` (numero, chave, cnpjEmi, cnpjDes, itens, valor). Toolbar flutuante top-right (zoom-, zoom+, separator, rotate). Indicador "1/1 · 100%" bottom-left.
  - **Resto:** Tabs (Conversa / Texto bruto / Histórico). Conversa é o default.
    - **Conversa:** thread ChatGPT-like, max-width 720px center. Mensagens AI sem bubble, mensagens do usuário em bubble com `border-radius: 10px 10px 2px 10px`. Respostas podem conter mini-tabela inline (3 cols: campo / valor / `Cite` chip). Hover no `Cite` chip pinta o bbox correspondente no viewer (state `hl: string[]`). Composer fixo no fundo com `Kbd ↵` e nota explicando "Para múltiplas notas, abra o Chat".
    - **Texto bruto:** `<pre>` mono 11.5px com o texto OCR.
    - **Histórico:** timeline vertical com bullet, eventos: Upload / OCR / Estrutura / Pergunta.
- **Rail direito (campos extraídos):** header "Campos extraídos · N" + helper "Passe o mouse para ver no documento". Lista de campos. Hover em campo com `bbox` pinta o bbox no doc; hover bidirecional. Campo destacado tem `borderLeft: 2px solid var(--v2-copper)` + `background: var(--v2-surface-2)`. Valor total renderizado em cobre, peso 500, 14px.

### 05 · Chat multi-nota (`HifiV2Chat`)

- **Sidebar 280px (esquerda):** header "Contexto · N notas" + helper. Lista de cards de notas (Badge tipo + número mono + emissor + valor + ✕ remover). Botão dashed "Adicionar nota". Footer com "Nova conversa".
- **Thread (direita):** header com título da conversa, meta-row (data, N notas, total consolidado mono), ações (Exportar conversa, kebab).
- Mensagens com max-width 760px center. Resposta inclui tabela renderizada (HTML `<table>`, headers em surface-2). Citations como `Badge secondary` com `Icon fileText`. Sugestões "Continuar com" embaixo da mensagem AI.
- **Composer:** input + `Kbd ↵` + send. Footer-row com "Contexto: N notas selecionadas" + "GPT-4o · Function calling ativo".

## Sistema de design

### Tokens (ver `tokens.css` e `reference/globals.css`)

Cores em **oklch** (dark-first). Principais:

- `--v2-bg` = preto absoluto (oklch 0.13 ou similar)
- `--v2-surface` / `--v2-surface-2` = degraus de superfície
- `--v2-fg` / `--v2-fg-mute` / `--v2-fg-dim` = 3 níveis de texto
- `--v2-line` / `--v2-line-strong` = bordas
- `--v2-copper` = único acento de marca (primary), oklch ≈ 0.74 0.13 42
- `--v2-good` / `--v2-warn` / `--v2-bad` = status

### Tipografia

- **Sans:** Geist (400, 500, 600)
- **Mono:** Geist Mono (400, 500) — usado em números, códigos, CNPJ, chaves NF-e, IDs
- **Serif editorial:** Instrument Serif italic — usado **apenas** em headlines decorativas (Login hero, page titles maiores). Evite usar em UI funcional.

### Primitives shadcn (a portar)

Em `hifi-v2.jsx`, no topo, estão definidos: `Button`, `Input`, `Badge`, `Card`, `Tabs`, `Avatar`, `Separator`, `Progress`, `StatusDot`, `Kbd`, `V2Topbar`, `Logo`. Substitua pelos componentes oficiais do shadcn, mantendo as variants:

- `Button`: variants `primary | secondary | outline | ghost`; sizes `sm | default | lg | icon`.
- `Badge`: variants `default | secondary | success | warning | danger | accent`.
- `Tabs`: ativo tem `background: var(--v2-surface-2)` + border-strong; inativo é ghost.

### Layout — Topbar

Ordem da esquerda para a direita: **Logo · `/` · WorkspaceAvatar + nome · ChevronDown · Separator · Nav (Início / Minhas notas / Chat) · Spacer · Search com `⌘K` · UserAvatar**.

Altura 52px, padding lateral 24px, border-bottom `1px solid var(--v2-line)`.

## Interactions & Behavior

- **Detail viewer ↔ chat citations:** state `hl: string[]` no `HifiV2Detail`. Mouse-enter num campo do rail OU num `Cite` chip da conversa → `setHl([bbox])`. Mouse-leave → `setHl([])`. `BBox` componente lê `hl` e renderiza outline cobre + label flutuante quando ativo. **Recriar com `useState` + handlers; nada de animação custosa, transição CSS 140ms `all ease`.**
- **Chat composer:** `⌘K` foca search da topbar; `↵` envia; `Shift+↵` quebra linha (a portar).
- **Sidebar de contexto (Chat page):** clicar `✕` num card remove a nota do array de contexto (state local). Botão dashed "Adicionar nota" abre command palette com lista das notas do usuário.
- **Upload steps:** ladder horizontal preenche da esquerda pra direita conforme cada step completa. Estados: `pending | active (com spinner) | done (com check) | error (cobre→bad)`.
- **Lista:** clicar linha navega `/notas/[id]`. Kebab abre dropdown (Ver, Exportar, Excluir).

## State Management

Por feature, conforme spec (custom hooks):

- `useDocumentUpload` — POST multipart, progress, retry
- `useDocumentList` — GET paginado, filtros (tipo, status, busca), sort
- `useDocumentDetail` — GET por id, inclui campos extraídos + chat existente
- `useChatStream` — POST mensagem, stream SSE, anexar tool calls (`get_full_document`)
- `useChatContext` — gerencia array de docIds no contexto do chat multi-nota

## Assets

- **Logo:** wordmark caseiro — `i` em quadrado preto/branco invertido + ponto cobre top-right + "Invoices" ao lado. Se quiser refazer em SVG real, manter a proporção e o ponto cobre como único acento.
- **OAuth logos:** Google e GitHub estão como inline SVG em `shared.jsx` (`GoogleLogo`, `GithubLogo`). Pode trocar pelos do `react-icons` ou `simple-icons`.
- **Ícones de UI:** stroke 1.6, 24x24 viewBox, definidos em `shared.jsx` (`Icon` component). Trocar por **lucide-react** no porte (mesmo estilo, mesmas convenções).
- **DANFE preview:** `InvoiceDoc` renderiza um mock textual. Em produção, substitua por `<Image>` do PDF/JPG real do upload + canvas overlay para os bboxes (que viriam da response do OCR).

## Files

```
handoff/
├── README.md            ← este arquivo
├── index.html           ← entry: monta DesignCanvas com 4 seções
├── tokens.css           ← variáveis oklch + fontes
├── shared.jsx           ← Icon, Brand, GoogleLogo, GithubLogo, Sidebar (v1)
├── hifi-v2.jsx          ← TODOS os primitives + 5 telas finais (foco aqui)
├── wireframes.jsx       ← versões low-fi das telas (referência inicial)
├── design-canvas.jsx    ← chrome do canvas (não portar)
├── tweaks-panel.jsx     ← chrome do tweaks (não portar)
└── reference/
    ├── globals.css      ← shadcn theme do projeto, tokens oklch
    └── spec.md          ← spec original do case
```

**O arquivo central é `hifi-v2.jsx`.** Todos os outros são suporte.

## Próximos passos sugeridos para o dev

1. Bootstrap Next.js + shadcn/ui + Tailwind. Aplicar `globals.css`.
2. Criar `app/login/page.tsx` partindo do `HifiV2Login`. Implementar NextAuth (Google + GitHub).
3. Criar `app/(authed)/layout.tsx` com a topbar (`HifiV2Topbar`).
4. `app/(authed)/page.tsx` ← `HifiV2Upload`. Conectar a `useDocumentUpload`.
5. `app/(authed)/notas/page.tsx` ← `HifiV2List`. Conectar a `useDocumentList`.
6. `app/(authed)/notas/[id]/page.tsx` ← `HifiV2Detail`. Conectar a `useDocumentDetail` + `useChatStream` (escopo: 1 doc).
7. `app/(authed)/chat/[id]/page.tsx` ← `HifiV2Chat`. Conectar a `useChatContext` + `useChatStream` (escopo: N docs).
