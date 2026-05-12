import { Injectable } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  InvoiceSummary,
  InvoiceSummaryResult,
} from '../ocr/schemas/invoice-summary.schema';

@Injectable()
export class DocumentStateService {
  constructor(private readonly prisma: PrismaService) {}

  async markRunning(id: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.OCR_RUNNING,
        ocrStartedAt: new Date(),
      },
    });
  }

  async markReady(
    id: string,
    summary: InvoiceSummary,
    extractedText: string,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.READY,
        summary: summary as never,
        extractedText,
        ocrCompletedAt: new Date(),
        failureReason: null,
      },
    });
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.FAILED,
        failureReason: reason,
        retryCount: { increment: 1 },
        ocrCompletedAt: new Date(),
      },
    });
  }

  async markRejected(
    id: string,
    reason: 'low_confidence' | 'unsupported_type',
    partial: InvoiceSummaryResult,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        documentType: partial.documentType,
        confidence: partial.confidence,
        rejectionReason: reason,
        summary: partial.summary as never,
        extractedText: partial.extractedText,
        ocrCompletedAt: new Date(),
      },
    });
  }
}
