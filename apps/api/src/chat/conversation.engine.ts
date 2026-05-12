import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { ChatRole, type LlmConfig } from '@prisma/client';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from './providers/llm-provider.interface';
import { ToolsRegistry } from './tools/tools-registry';
import { Inject } from '@nestjs/common';

type PendingMessage = {
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: object;
};

export type RunContext = {
  userId: string;
  systemPrompt: string;
  llmConfig: LlmConfig;
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
export class ConversationEngine {
  private readonly logger = new Logger(ConversationEngine.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly tools: ToolsRegistry,
    private readonly config: ConfigService,
  ) {}

  async run(ctx: RunContext): Promise<{ content: string }> {
    const maxIter = this.config.get<number>('CHAT_MAX_TOOL_ITERATIONS') ?? 3;
    const model = ctx.llmConfig.model;
    const params = (ctx.llmConfig.params ?? {}) as Record<string, unknown>;
    const temperature =
      typeof params.temperature === 'number' ? params.temperature : undefined;

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
        temperature,
      })) as ChatCompletion;

      const message = resp.choices[0].message;
      const functionCalls = (message.tool_calls ?? []).filter(
        (c): c is Extract<typeof c, { type: 'function' }> =>
          c.type === 'function',
      );

      if (functionCalls.length) {
        await ctx.persist({
          role: 'ASSISTANT',
          content: message.content ?? '',
          toolCallId: functionCalls[0].id,
          toolName: functionCalls[0].function.name,
          toolArgs: JSON.parse(
            functionCalls[0].function.arguments || '{}',
          ) as object,
        });

        conversation.push({
          role: 'assistant',
          content: message.content ?? null,
          tool_calls: functionCalls,
        });

        for (const call of functionCalls) {
          const handler = this.tools.getHandler(call.function.name);
          if (!handler) {
            this.logger.error({
              event: 'chat.unknown_tool',
              tool: call.function.name,
            });
            throw new InternalServerErrorException({ code: 'unknown_tool' });
          }
          const args = JSON.parse(call.function.arguments || '{}') as object;
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
