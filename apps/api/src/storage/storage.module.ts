import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { STORAGE_SERVICE } from './storage.service';
import { RailwayVolumeProvider } from './providers/railway-volume.provider';

@Module({
  imports: [ConfigModule],
  providers: [{ provide: STORAGE_SERVICE, useClass: RailwayVolumeProvider }],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
