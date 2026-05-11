import type {
  DocumentEditDto as SharedDocumentEditDto,
  DocumentEditSnapshot,
} from '@invoices-ocr/shared-types';

export type DocumentEditDto = SharedDocumentEditDto;

interface DocumentEditRow {
  id: string;
  createdAt: Date;
  before: unknown;
  after: unknown;
  editor: { name: string | null; email: string | null } | null;
}

export function toEditDto(row: DocumentEditRow): DocumentEditDto {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    editor: {
      name: row.editor?.name ?? null,
      email: row.editor?.email ?? null,
    },
    before: (row.before ?? {}) as DocumentEditSnapshot,
    after: (row.after ?? {}) as DocumentEditSnapshot,
  };
}
