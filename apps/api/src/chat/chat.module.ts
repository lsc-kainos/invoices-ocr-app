import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from './providers/llm-provider.interface';
import { OpenaiLlmProvider } from './providers/openai-llm.provider';
import { MockLlmProvider } from './providers/mock-llm.provider';
import { ToolsRegistry } from './tools/tools-registry';
import { GetFullDocumentTool } from './tools/get-full-document.tool';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ToolsRegistry,
    GetFullDocumentTool,
    {
      provide: LLM_PROVIDER,
      useFactory: (config: ConfigService): LlmProvider => {
        if (config.get('LLM_PROVIDER') === 'mock') return new MockLlmProvider();
        return new OpenaiLlmProvider(
          config.getOrThrow('OPENAI_API_KEY'),
          config.get('CHAT_MODEL') ?? 'gpt-4o-mini',
        );
      },
      inject: [ConfigService],
    },
  ],
})
export class ChatModule {}
