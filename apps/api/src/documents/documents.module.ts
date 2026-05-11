import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { OCR_QUEUE_NAME } from '../ocr/queues/ocr.queue';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentDuplicateService } from './document-duplicate.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: OCR_QUEUE_NAME }),
    ConfigModule,
    PrismaModule,
    StorageModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentDuplicateService],
  exports: [DocumentsService, DocumentDuplicateService],
})
export class DocumentsModule {}
