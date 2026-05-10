import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE } from './storage.service';
import { RailwayVolumeProvider } from './providers/railway-volume.provider';
import { CloudflareR2Provider } from './providers/cloudflare-r2.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const driver = cfg.get<string>('STORAGE_DRIVER') ?? 'volume';
        return driver === 'r2'
          ? new CloudflareR2Provider(cfg)
          : new RailwayVolumeProvider(cfg);
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
