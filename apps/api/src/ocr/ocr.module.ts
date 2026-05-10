import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
import { DocumentsModule } from '../documents/documents.module';
import { DocumentsService } from '../documents/documents.service';
import { OcrService, DOCUMENT_OPS } from './ocr.service';
import { OcrProcessor } from './processors/ocr.processor';
import { OCR_QUEUE_NAME } from './queues/ocr.queue';
import { OCR_PROVIDER } from './providers/ocr-provider.interface';
import { MockOcrProvider } from './providers/mock-ocr.provider';
import { OpenAiOcrProvider } from './providers/openai-ocr.provider';

@Module({
  imports: [
    BullModule.registerQueue({ name: OCR_QUEUE_NAME }),
    ConfigModule,
    StorageModule,
    forwardRef(() => DocumentsModule),
  ],
  providers: [
    OcrService,
    OcrProcessor,
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
