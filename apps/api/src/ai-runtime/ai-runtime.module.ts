import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiRuntimeService } from './ai-runtime.service';
import { LlmConfigService } from './llm-config.service';
import { LlmConfigController } from './llm-config.controller';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  providers: [AiRuntimeService, LlmConfigService],
  controllers: [LlmConfigController],
  exports: [AiRuntimeService, LlmConfigService],
})
export class AiRuntimeModule {}
