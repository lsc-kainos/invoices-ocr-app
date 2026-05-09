import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { PrismaService } from '../prisma/prisma.service';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from './providers/llm-provider.interface';
import { ToolsRegistry } from './tools/tools-registry';

type PendingMessage = {
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: object;
};

type RunContext = {
  userId: string;
  systemPrompt: string;
  messages: {
    role: 'USER' | 'ASSISTANT' | 'TOOL';
    content: string;
    toolCallId?: string | null;
    toolName?: string | null;
  }[];
  persist: (msg: PendingMessage) => Promise<unknown>;
  onAssistantDelta?: (chunk: string) => void;
};

@Injectable()
export class ChatService {
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly tools: ToolsRegistry,
    private readonly config: ConfigService,
    logger?: Logger,
  ) {
    this.logger = logger ?? new Logger(ChatService.name);
  }

  private async runConversation(ctx: RunContext): Promise<{ content: string }> {
    const maxIter = this.config.get<number>('CHAT_MAX_TOOL_ITERATIONS') ?? 3;
    const model = this.config.get<string>('CHAT_MODEL') ?? 'gpt-4o-mini';

    const conversation: ChatCompletionMessageParam[] = [
      { role: 'system', content: ctx.systemPrompt },
      ...ctx.messages.map(toOpenAiMessage),
    ];

    let iter = 0;
    while (iter < maxIter) {
      const resp = (await this.llm.complete({
        model,
        messages: conversation,
        tools: this.tools.getOpenAiSchemas(),
        stream: false,
      })) as any;

      const message = resp.choices[0].message;

      if (message.tool_calls?.length) {
        await ctx.persist({
          role: 'ASSISTANT',
          content: message.content ?? '',
          toolCallId: message.tool_calls[0].id,
          toolName: message.tool_calls[0].function.name,
          toolArgs: JSON.parse(
            message.tool_calls[0].function.arguments || '{}',
          ),
        });

        conversation.push({
          role: 'assistant',
          content: message.content ?? null,
          tool_calls: message.tool_calls,
        } as ChatCompletionAssistantMessageParam);

        for (const call of message.tool_calls) {
          const handler = this.tools.getHandler(call.function.name);
          if (!handler) {
            this.logger.error({
              event: 'chat.unknown_tool',
              tool: call.function.name,
            });
            throw new InternalServerErrorException({ code: 'unknown_tool' });
          }
          const args = JSON.parse(call.function.arguments || '{}');
          const output = await handler(args, { userId: ctx.userId });
          const outputJson = JSON.stringify(output);

          await ctx.persist({
            role: 'TOOL',
            content: outputJson,
            toolCallId: call.id,
            toolName: call.function.name,
          });

          conversation.push({
            role: 'tool',
            tool_call_id: call.id,
            content: outputJson,
          });
        }

        iter++;
        continue;
      }

      await ctx.persist({ role: 'ASSISTANT', content: message.content ?? '' });
      return { content: message.content ?? '' };
    }

    this.logger.error({
      event: 'chat.tool_loop_exceeded',
      userId: ctx.userId,
      iter,
    });
    throw new InternalServerErrorException({ code: 'tool_loop_exceeded' });
  }
}

function toOpenAiMessage(
  m: RunContext['messages'][0],
): ChatCompletionMessageParam {
  if (m.role === 'TOOL') {
    return {
      role: 'tool',
      tool_call_id: m.toolCallId ?? '',
      content: m.content,
    };
  }
  return {
    role: m.role.toLowerCase() as 'user' | 'assistant',
    content: m.content,
  };
}
