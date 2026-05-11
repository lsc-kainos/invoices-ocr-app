import type { InvoiceSummary } from './invoice-summary.js';

/**
 * Snapshot dos campos editáveis em uma revisão manual. Tipicamente é um
 * `InvoiceSummary` completo, mas como o histórico pode ter sido criado em
 * versões anteriores do schema, deixamos parcial para tolerar campos faltando.
 */
export type DocumentEditSnapshot = Partial<InvoiceSummary> & Record<string, unknown>;

export interface DocumentEditEditor {
  name: string | null;
  email: string | null;
}

export interface DocumentEditDto {
  id: string;
  createdAt: string;
  editor: DocumentEditEditor;
  before: DocumentEditSnapshot;
  after: DocumentEditSnapshot;
}
