import type { DocumentStatus } from './document-status';
import type { InvoiceSummary } from './invoice-summary';

export interface DocumentSummary {
  id: string;
  status: DocumentStatus;
  filename: string;
  mime: string;
  size: number;
  summary: InvoiceSummary | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
