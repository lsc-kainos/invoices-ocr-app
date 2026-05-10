import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
import { DocumentsModule } from '../documents/documents.module';
import { DocumentsService } from '../documents/documents.service';
import { AiRuntimeModule } from '../ai-runtime/ai-runtime.module';
import { OcrService, DOCUMENT_OPS } from './ocr.service';
import { OcrProcessor } from './processors/ocr.processor';
import { OCR_QUEUE_NAME } from './queues/ocr.queue';
import { ExtractorService } from './extractor.service';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { MockOcrProvider } from './providers/mock-ocr.provider';

@Module({
  imports: [
    BullModule.registerQueue({ name: OCR_QUEUE_NAME }),
    ConfigModule,
    StorageModule,
    forwardRef(() => DocumentsModule),
    AiRuntimeModule,
  ],
  providers: [
    OcrService,
    OcrProcessor,
    ExtractorService,
    MockOcrProvider,
    {
      provide: OCR_PROVIDER,
      inject: [ConfigService, ExtractorService, MockOcrProvider],
      useFactory: (
        cfg: ConfigService,
        extractor: ExtractorService,
        mock: MockOcrProvider,
      ) => (cfg.get('LLM_PROVIDER') === 'mock' ? mock : extractor),
    },
    { provide: DOCUMENT_OPS, useExisting: DocumentsService },
  ],
  exports: [OcrService, ExtractorService],
})
export class OcrModule {}
