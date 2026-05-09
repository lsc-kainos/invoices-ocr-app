import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { ChatRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from './providers/llm-provider.interface';
import { ToolsRegistry } from './tools/tools-registry';
import {
  buildDocumentSystem,
  buildWorkspaceSystem,
} from './prompts/system.prompt';
import { titleFromContent } from './helpers/title-from-content';

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

  get streamingEnabled(): boolean {
    return this.config.get<boolean>('CHAT_STREAMING') === true;
  }

  async createSession(userId: string) {
    return this.prisma.chatSession.create({
      data: { userId },
      select: { id: true, createdAt: true },
    });
  }

  async listSessions(userId: string, limit: number) {
    return this.prisma.chatSession.findMany({
      where: { userId, documentId: null },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async listMessages(userId: string, sessionId: string, includeTool: boolean) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException();

    return this.prisma.chatMessage.findMany({
      where: {
        sessionId,
        ...(includeTool ? {} : { role: { not: ChatRole.TOOL } }),
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
  }

  async sendWorkspaceMessage(
    userId: string,
    sessionId: string,
    content: string,
  ) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException();

    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'USER', content },
    });

    const history = await this.loadHistory(sessionId, userId);
    const docs = await this.prisma.document.findMany({
      where: { userId, status: 'READY' },
      select: { id: true, filename: true, summary: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const result = await this.runConversation({
      userId,
      systemPrompt: buildWorkspaceSystem(docs as any),
      messages: history,
      persist: (msg) =>
        this.prisma.chatMessage.create({ data: { sessionId, ...msg } }),
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: session.title ?? titleFromContent(content),
        updatedAt: new Date(),
      },
    });

    return { content: result.content };
  }

  async sendDocumentMessage(
    userId: string,
    documentId: string,
    content: string,
  ) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true, filename: true, summary: true, status: true },
    });
    if (!doc) throw new NotFoundException();
    if (doc.status !== 'READY') {
      throw new ConflictException({ code: 'document_not_ready' });
    }

    const session = await this.prisma.chatSession.upsert({
      where: { userId_documentId: { userId, documentId } },
      create: { userId, documentId },
      update: {},
    });

    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'USER', content },
    });

    const history = await this.loadHistory(session.id, userId);
    const result = await this.runConversation({
      userId,
      systemPrompt: buildDocumentSystem(doc as any),
      messages: history,
      persist: (msg) =>
        this.prisma.chatMessage.create({
          data: { sessionId: session.id, ...msg },
        }),
    });

    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return { content: result.content };
  }

  async listDocumentMessages(
    userId: string,
    documentId: string,
    includeTool: boolean,
  ) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException();

    const session = await this.prisma.chatSession.findFirst({
      where: { userId, documentId },
      select: { id: true },
    });
    if (!session) return [];

    return this.prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
        ...(includeTool ? {} : { role: { not: ChatRole.TOOL } }),
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
  }

  async runConversationStream(ctx: RunContext, res: any): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      await this.runConversation(ctx);
      // Streaming is single-chunk (token-by-token is backlog)
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: 'unexpected' })}\n\n`);
      res.end();
      throw err;
    }
  }

  async clearDocumentMessages(userId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException();

    const session = await this.prisma.chatSession.findFirst({
      where: { userId, documentId },
      select: { id: true },
    });
    if (!session) return;

    await this.prisma.chatMessage.deleteMany({
      where: { sessionId: session.id, session: { userId } },
    });
  }

  private async loadHistory(sessionId: string, userId: string) {
    const max = this.config.get<number>('CHAT_MAX_HISTORY') ?? 20;
    const all = await this.prisma.chatMessage.findMany({
      where: { sessionId, session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: max,
      select: { role: true, content: true, toolCallId: true, toolName: true },
    });
    return all.reverse();
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
