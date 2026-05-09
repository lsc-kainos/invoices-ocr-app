import type { Document, DocumentStatus } from '@prisma/client';
import type { InvoiceSummary } from '../../ocr/schemas/invoice-summary.schema';

export interface DocumentSummaryDto {
  id: string;
  status: DocumentStatus;
  filename: string;
  mime: string;
  size: number;
  summary: InvoiceSummary | null;
  failureReason: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toSummaryDto(doc: Document): DocumentSummaryDto {
  return {
    id: doc.id,
    status: doc.status,
    filename: doc.filename,
    mime: doc.mime,
    size: doc.size,
    summary: (doc.summary as InvoiceSummary | null) ?? null,
    failureReason: doc.failureReason,
    retryCount: doc.retryCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
