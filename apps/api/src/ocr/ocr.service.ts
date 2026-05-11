import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  OCR_PROVIDER,
  type OcrProvider,
} from './providers/ocr-provider.interface';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.service';
import {
  invoiceSummarySchema,
  type InvoiceSummary,
  type InvoiceSummaryResult,
} from './schemas/invoice-summary.schema';
import { isTransient } from './helpers/is-transient';
import { classifyError } from './helpers/classify-error';
import { pdfToImage } from './helpers/pdf-to-image';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(OCR_PROVIDER) private readonly provider: OcrProvider,
    private readonly config: ConfigService,
  ) {}

  async process(docId: string, userId: string): Promise<void> {
    await this.markRunning(docId);

    try {
      const doc = await this.findByIdInternal(docId, userId);
      if (!doc) {
        await this.markFailed(docId, 'unknown');
        return;
      }
      const buffer = await this.storage.read(doc.storagePath);
      const isPdf = doc.mime === 'application/pdf';
      const imageBuffer = isPdf ? await pdfToImage(buffer) : buffer;
      const imageMime = isPdf ? 'image/png' : doc.mime;
      const result = await this.provider.extract(imageBuffer, imageMime);
      const parsed = invoiceSummarySchema.parse(result);

      const threshold =
        this.config.get<number>('OCR_REJECT_CONFIDENCE_THRESHOLD') ?? 0.6;
      const ALLOWED_TYPES = [
        'nf-e',
        'nfs-e',
        'boleto',
        'invoice',
        'receipt',
      ] as const;

      if (
        !ALLOWED_TYPES.includes(
          parsed.documentType as (typeof ALLOWED_TYPES)[number],
        )
      ) {
        await this.markRejected(docId, 'unsupported_type', parsed);
        this.logger.log(
          `OCR rejected docId=${docId} reason=unsupported_type type=${parsed.documentType}`,
        );
        return;
      }
      if (parsed.confidence < threshold) {
        await this.markRejected(docId, 'low_confidence', parsed);
        this.logger.log(
          `OCR rejected docId=${docId} reason=low_confidence confidence=${parsed.confidence}`,
        );
        return;
      }

      await this.markReady(docId, parsed.summary, parsed.extractedText);
      this.logger.log(`OCR ok docId=${docId}`);
    } catch (err) {
      if (isTransient(err)) {
        this.logger.warn(
          `OCR transient err docId=${docId} — propagando para BullMQ retry`,
        );
        throw err;
      }
      const code = classifyError(err);
      const e = err as {
        name?: string;
        message?: string;
        status?: number;
        code?: string;
        stack?: string;
      };
      const detail = [
        e.name && `name=${e.name}`,
        e.status && `status=${e.status}`,
        e.code && `errCode=${e.code}`,
        e.message && `message=${e.message.slice(0, 300)}`,
      ]
        .filter(Boolean)
        .join(' ');
      this.logger.warn(`OCR failed docId=${docId} reason=${code} ${detail}`);
      if (code === 'unknown' && e.stack) {
        this.logger.warn(
          `OCR stack docId=${docId}: ${e.stack.split('\n').slice(0, 6).join(' | ')}`,
        );
      }
      await this.markFailed(docId, code);
    }
  }

  private async markRunning(id: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.OCR_RUNNING,
        ocrStartedAt: new Date(),
      },
    });
  }

  private async markReady(
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

  private async markFailed(id: string, reason: string): Promise<void> {
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

  private async markRejected(
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

  private async findByIdInternal(
    id: string,
    userId: string,
  ): Promise<{ id: string; mime: string; storagePath: string } | null> {
    return this.prisma.document.findFirst({
      where: { id, userId },
      select: { id: true, mime: true, storagePath: true },
    });
  }
}
