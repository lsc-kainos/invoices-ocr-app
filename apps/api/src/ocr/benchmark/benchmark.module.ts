import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrModule } from '../ocr.module';
import { AiRuntimeModule } from '../../ai-runtime/ai-runtime.module';
import { AuthModule } from '../../auth/auth.module';
import { BenchmarkController } from './benchmark.controller';
import { BenchmarkService } from './benchmark.service';
import { BenchmarkPersistenceService } from './benchmark-persistence.service';

@Module({
  imports: [ConfigModule, OcrModule, AiRuntimeModule, AuthModule],
  controllers: [BenchmarkController],
  providers: [BenchmarkService, BenchmarkPersistenceService],
})
export class BenchmarkModule {}
