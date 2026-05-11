import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrModule } from '../ocr.module';
import { AuthModule } from '../../auth/auth.module';
import { BenchmarkController } from './benchmark.controller';
import { BenchmarkService } from './benchmark.service';

@Module({
  imports: [ConfigModule, OcrModule, AuthModule],
  controllers: [BenchmarkController],
  providers: [BenchmarkService],
})
export class BenchmarkModule {}
