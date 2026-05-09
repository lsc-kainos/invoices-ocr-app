import type { InvoiceSummaryResult } from '../schemas/invoice-summary.schema';

export const OCR_PROVIDER = Symbol('OCR_PROVIDER');

export interface OcrProvider {
  extract(buffer: Buffer, mime: string): Promise<InvoiceSummaryResult>;
}
