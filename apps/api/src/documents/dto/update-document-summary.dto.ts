import { IsObject } from 'class-validator';
import type { InvoiceSummary } from '../../ocr/schemas/invoice-summary.schema';

export class UpdateDocumentSummaryDto {
  @IsObject()
  summary!: InvoiceSummary;
}
