import type { Document } from '@prisma/client';
import { type DocumentSummaryDto, toSummaryDto } from './document-summary.dto';

export interface DocumentDetailDto extends DocumentSummaryDto {
  extractedText: string | null;
  ocrStartedAt: string | null;
  ocrCompletedAt: string | null;
  fileUrl: string;
}

export function toDetailDto(doc: Document, fileUrl: string): DocumentDetailDto {
  return {
    ...toSummaryDto(doc),
    extractedText: doc.extractedText,
    ocrStartedAt: doc.ocrStartedAt?.toISOString() ?? null,
    ocrCompletedAt: doc.ocrCompletedAt?.toISOString() ?? null,
    fileUrl,
  };
}
