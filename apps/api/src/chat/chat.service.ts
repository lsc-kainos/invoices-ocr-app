import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
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

  async runConversation(ctx: RunContext): Promise<{ content: string }> {
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
        // (Implemented in Task 9)
        throw new Error('not_implemented_yet');
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
