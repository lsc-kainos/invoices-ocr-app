import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BenchmarkController } from './benchmark.controller';
import { BenchmarkService } from './benchmark.service';
import { OpenAiOcrProvider } from '../providers/openai-ocr.provider';

@Module({
  imports: [ConfigModule],
  controllers: [BenchmarkController],
  providers: [BenchmarkService, OpenAiOcrProvider],
})
export class BenchmarkModule {}
