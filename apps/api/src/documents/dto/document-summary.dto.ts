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
  contentHash: string | null;
  duplicateOfId: string | null;
  duplicateReason: string | null;
  documentType: string | null;
  confidence: number | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
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
    contentHash: doc.contentHash ?? null,
    duplicateOfId: doc.duplicateOfId ?? null,
    duplicateReason: doc.duplicateReason ?? null,
    documentType: doc.documentType ?? null,
    confidence: doc.confidence ?? null,
    rejectionReason: doc.rejectionReason ?? null,
    verifiedAt: doc.verifiedAt?.toISOString() ?? null,
    verifiedBy: doc.verifiedBy ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
