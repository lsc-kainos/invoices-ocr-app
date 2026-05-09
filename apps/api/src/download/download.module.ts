import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({ imports: [PrismaModule, StorageModule] })
export class DownloadModule {}
