import type { DocumentSummary } from './document-summary';

export interface DocumentDetail extends DocumentSummary {
  extractedText: string | null;
  ocrStartedAt: string | null;
  ocrCompletedAt: string | null;
  fileUrl: string;
}
