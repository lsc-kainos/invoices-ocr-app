import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRole, LlmConfig, LlmConfigKey } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmConfigService } from '../ai-runtime/llm-config.service';
import { ConversationEngine } from './conversation.engine';
import {
  buildDocumentSystem,
  buildWorkspaceSystem,
} from './prompts/system.prompt';
import { titleFromContent } from './helpers/title-from-content';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly llmConfigService: LlmConfigService,
    private readonly engine: ConversationEngine,
  ) {}

  private async loadActiveChatConfig(): Promise<LlmConfig> {
    const cfg = await this.llmConfigService.findActive(LlmConfigKey.CHAT);
    if (!cfg) {
      throw new InternalServerErrorException(
        `No active LlmConfig for key=${LlmConfigKey.CHAT}`,
      );
    }
    return cfg;
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

    const llmConfig = await this.loadActiveChatConfig();
    const history = await this.loadHistory(sessionId, userId);
    const docs = await this.prisma.document.findMany({
      where: { userId, status: 'READY' },
      select: { id: true, filename: true, summary: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const result = await this.engine.run({
      userId,
      llmConfig,
      systemPrompt: buildWorkspaceSystem(llmConfig.prompt, docs as any),
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

    const llmConfig = await this.loadActiveChatConfig();
    const history = await this.loadHistory(session.id, userId);
    const result = await this.engine.run({
      userId,
      llmConfig,
      systemPrompt: buildDocumentSystem(llmConfig.prompt, doc as any),
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
    const ordered = all.reverse();
    // Garante que o slice comeca em USER. Se o limite cortar no meio de um
    // tool exchange (ex: ASSISTANT tool_calls fora, TOOL response dentro),
    // o TOOL fica orfao e a OpenAI rejeita com 400. Descarta lideres
    // ASSISTANT/TOOL ate encontrar o primeiro USER.
    const firstUser = ordered.findIndex((m) => m.role === ChatRole.USER);
    return firstUser === -1 ? [] : ordered.slice(firstUser);
  }
}
