import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentStateService } from './document-state.service';
import { FileDeliveryService } from './file-delivery.service';

@Module({
  imports: [ConfigModule, PrismaModule, StorageModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentStateService, FileDeliveryService],
  exports: [DocumentsService, DocumentStateService, FileDeliveryService],
})
export class DocumentsModule {}
