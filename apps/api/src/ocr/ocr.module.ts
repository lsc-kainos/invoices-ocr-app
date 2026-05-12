import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentsModule } from '../documents/documents.module';
import { AiRuntimeModule } from '../ai-runtime/ai-runtime.module';
import { OcrService } from './ocr.service';
import { OcrProcessor } from './processors/ocr.processor';
import { OcrEventListener } from './ocr-event.listener';
import { OCR_QUEUE_NAME } from './queues/ocr.queue';
import { ExtractorService } from './extractor.service';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { MockOcrProvider } from './providers/mock-ocr.provider';

@Module({
  imports: [
    BullModule.registerQueue({ name: OCR_QUEUE_NAME }),
    ConfigModule,
    PrismaModule,
    StorageModule,
    DocumentsModule,
    AiRuntimeModule,
  ],
  providers: [
    OcrService,
    OcrProcessor,
    OcrEventListener,
    ExtractorService,
    MockOcrProvider,
    {
      provide: OCR_PROVIDER,
      inject: [ConfigService, ExtractorService, MockOcrProvider],
      useFactory: (
        cfg: ConfigService,
        extractor: ExtractorService,
        mock: MockOcrProvider,
      ) => (cfg.get('OCR_PROVIDER') === 'mock' ? mock : extractor),
    },
  ],
  exports: [OcrService, ExtractorService],
})
export class OcrModule {}
