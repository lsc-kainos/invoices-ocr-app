import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OcrService } from '../ocr.service';
import { DocumentUploadedEvent } from '../../documents/events/document-uploaded.event';

@Injectable()
export class DocumentUploadedHandler {
  private readonly logger = new Logger(DocumentUploadedHandler.name);

  constructor(private readonly ocr: OcrService) {}

  @OnEvent(DocumentUploadedEvent.NAME, { async: true, promisify: true })
  async handle(event: DocumentUploadedEvent): Promise<void> {
    try {
      await this.ocr.process(event.documentId);
    } catch (err) {
      this.logger.error(
        `OCR handler swallow err docId=${event.documentId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
