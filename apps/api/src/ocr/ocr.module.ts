import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
import { DocumentsModule } from '../documents/documents.module';
import { DocumentsService } from '../documents/documents.service';
import { OcrService, DOCUMENT_OPS } from './ocr.service';
import { DocumentUploadedHandler } from './handlers/document-uploaded.handler';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { MockOcrProvider } from './providers/mock-ocr.provider';
import { OpenAiOcrProvider } from './providers/openai-ocr.provider';

@Module({
  imports: [ConfigModule, StorageModule, forwardRef(() => DocumentsModule)],
  providers: [
    OcrService,
    DocumentUploadedHandler,
    {
      provide: OCR_PROVIDER,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        cfg.get<string>('OCR_PROVIDER') === 'openai'
          ? new OpenAiOcrProvider(cfg)
          : new MockOcrProvider(),
    },
    { provide: DOCUMENT_OPS, useExisting: DocumentsService },
  ],
  exports: [OcrService],
})
export class OcrModule {}
