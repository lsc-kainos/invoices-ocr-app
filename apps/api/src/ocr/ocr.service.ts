import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { DocumentDuplicateService } from '../documents/document-duplicate.service';

export const DOCUMENT_OPS = Symbol('DOCUMENT_OPS');

export interface DocumentOps {
  markRunning(id: string): Promise<void>;
  markReady(
    id: string,
    summary: InvoiceSummary,
    extractedText: string,
    semanticHash: string | null,
  ): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  markRejected(
    id: string,
    reason: 'low_confidence' | 'unsupported_type',
    partial: InvoiceSummaryResult,
  ): Promise<void>;
  markDuplicate(
    id: string,
    duplicateOfId: string,
    reason: string,
    partial: InvoiceSummaryResult,
    semanticHash: string,
  ): Promise<void>;
  findReadyDuplicate(
    id: string,
    semanticHash: string,
  ): Promise<{ id: string } | null>;
  findByIdInternal(
    id: string,
  ): Promise<{ id: string; mime: string; storagePath: string } | null>;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @Inject(DOCUMENT_OPS) private readonly docs: DocumentOps,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(OCR_PROVIDER) private readonly provider: OcrProvider,
    private readonly config: ConfigService,
    private readonly duplicates: DocumentDuplicateService,
  ) {}

  async process(docId: string): Promise<void> {
    await this.docs.markRunning(docId);

    try {
      const doc = await this.docs.findByIdInternal(docId);
      if (!doc) {
        await this.docs.markFailed(docId, 'unknown');
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
        await this.docs.markRejected(docId, 'unsupported_type', parsed);
        this.logger.log(
          `OCR rejected docId=${docId} reason=unsupported_type type=${parsed.documentType}`,
        );
        return;
      }
      if (parsed.confidence < threshold) {
        await this.docs.markRejected(docId, 'low_confidence', parsed);
        this.logger.log(
          `OCR rejected docId=${docId} reason=low_confidence confidence=${parsed.confidence}`,
        );
        return;
      }

      const duplicateSignature = this.duplicates.computeSignature(parsed);
      if (
        duplicateSignature &&
        parsed.confidence >= duplicateSignature.minConfidence
      ) {
        const duplicate = await this.docs.findReadyDuplicate(
          docId,
          duplicateSignature.semanticHash,
        );
        if (duplicate) {
          await this.docs.markDuplicate(
            docId,
            duplicate.id,
            duplicateSignature.reason,
            parsed,
            duplicateSignature.semanticHash,
          );
          this.logger.log(
            `OCR duplicate docId=${docId} duplicateOf=${duplicate.id} reason=${duplicateSignature.reason}`,
          );
          return;
        }
      }

      await this.docs.markReady(
        docId,
        parsed.summary,
        parsed.extractedText,
        duplicateSignature?.semanticHash ?? null,
      );
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
      await this.docs.markFailed(docId, code);
    }
  }
}
