import type { InvoiceSummary } from '@invoices-ocr/shared-types';

const escXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function buildDocumentSystem(
  rules: string,
  doc: {
    id: string;
    filename: string;
    summary: InvoiceSummary | null;
  },
): string {
  const narrative = doc.summary?.narrative ?? '';
  const structured = {
    core: doc.summary?.core,
    items: doc.summary?.items ?? [],
    extras: doc.summary?.extras ?? [],
  };
  return [
    rules,
    '',
    'Contexto:',
    'O usuário está olhando um único documento. O resumo abaixo já inclui um sumário em prosa (narrative) e o JSON estruturado (core/items/extras). Use a tool apenas se isso não bastar.',
    '',
    `<document id="${escXml(doc.id)}">`,
    `  <filename>${escXml(doc.filename)}</filename>`,
    `  <narrative>${escXml(narrative)}</narrative>`,
    `  <summary>${escXml(JSON.stringify(structured))}</summary>`,
    `</document>`,
  ].join('\n');
}

export function buildWorkspaceSystem(
  rules: string,
  docs: Array<{ id: string; filename: string; summary: InvoiceSummary | null }>,
): string {
  if (docs.length === 0) {
    return `${rules}\n\nO usuário ainda não fez upload de nenhum documento. Sugira que ele comece pela página inicial.`;
  }
  const list = docs
    .map((d) => {
      const narrative = escXml(
        (d.summary?.narrative ?? '').toString().slice(0, 240),
      );
      const core = escXml(JSON.stringify(d.summary?.core ?? {}));
      return `  <document id="${escXml(d.id)}" filename="${escXml(d.filename)}">
    <narrative>${narrative}</narrative>
    <core>${core}</core>
  </document>`;
    })
    .join('\n');
  return [
    rules,
    '',
    'Documentos do usuário (use get_full_document(documentId) para detalhe):',
    `<documents>`,
    list,
    `</documents>`,
  ].join('\n');
}
