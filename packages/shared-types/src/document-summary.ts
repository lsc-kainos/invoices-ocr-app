import type { DocumentStatus } from './document-status.js';
import type { InvoiceSummary } from './invoice-summary.js';

export interface DocumentSummary {
  id: string;
  status: DocumentStatus;
  filename: string;
  mime: string;
  size: number;
  summary: InvoiceSummary | null;
  failureReason: string | null;
  retryCount: number;
  documentType: string | null;
  confidence: number | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
