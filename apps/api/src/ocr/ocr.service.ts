import { Inject, Injectable, Logger } from '@nestjs/common';
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
} from './schemas/invoice-summary.schema';
import { isTransient } from './helpers/is-transient';
import { classifyError } from './helpers/classify-error';
import { pdfToImage } from './helpers/pdf-to-image';

export const DOCUMENT_OPS = Symbol('DOCUMENT_OPS');

export interface DocumentOps {
  markRunning(id: string): Promise<void>;
  markReady(
    id: string,
    summary: InvoiceSummary,
    extractedText: string,
  ): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
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
      await this.docs.markReady(docId, parsed.summary, parsed.extractedText);
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
