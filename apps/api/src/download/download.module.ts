import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule {}
