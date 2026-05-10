import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.schema';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { DocumentsModule } from './documents/documents.module';
import { OcrModule } from './ocr/ocr.module';
import { BenchmarkModule } from './ocr/benchmark/benchmark.module';
import { QueuesAdminModule } from './admin/queues.module';
import { ChatModule } from './chat/chat.module';
import { DownloadModule } from './download/download.module';
import { AiRuntimeModule } from './ai-runtime/ai-runtime.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { UserScopedThrottlerGuard } from './auth/guards/user-scoped-throttler.guard';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: { url: cfg.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 240 },
      { name: 'upload', ttl: 60_000, limit: 60 },
      { name: 'ocr', ttl: 60_000, limit: 30 },
      { name: 'benchmark', ttl: 3_600_000, limit: 5 },
      { name: 'chat', ttl: 60_000, limit: 15 },
      { name: 'download', ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StorageModule,
    DocumentsModule,
    OcrModule,
    ChatModule,
    DownloadModule,
    AiRuntimeModule,
    ...(process.env.NODE_ENV !== 'test' ? [BenchmarkModule] : []),
    ...(process.env.BULL_BOARD_ENABLED === 'true' ? [QueuesAdminModule] : []),
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: UserScopedThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
