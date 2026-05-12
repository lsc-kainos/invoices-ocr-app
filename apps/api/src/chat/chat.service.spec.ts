import { InternalServerErrorException } from '@nestjs/common';
import { LlmConfigKey } from '@prisma/client';
import { ChatService } from './chat.service';
import { ConversationEngine } from './conversation.engine';
import { MockLlmProvider } from './providers/mock-llm.provider';

const mockLlmConfig = {
  id: 'llmcfg-chat-1',
  key: LlmConfigKey.CHAT,
  version: 1,
  model: 'gpt-4o-mini',
  prompt: 'You are a test assistant. Rules: ...',
  params: { temperature: 0.7 },
  active: true,
  notes: null,
  createdBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const makeLlmConfigService = (cfg: unknown = mockLlmConfig) =>
  ({
    findActive: jest.fn().mockResolvedValue(cfg),
  }) as any;

describe('ConversationEngine.run (sem tool)', () => {
  it('persiste assistant e retorna content quando LLM responde direto', async () => {
    const persisted: any[] = [];
    const persist = jest.fn(async (m) => {
      persisted.push(m);
      return { ...m, id: `m${persisted.length}` };
    });
    const llm = new MockLlmProvider();
    const registry = {
      getOpenAiSchemas: () => [],
      getHandler: () => null,
    } as any;
    const engine = new ConversationEngine(llm, registry, {
      get: (k: string) => (({ CHAT_MAX_TOOL_ITERATIONS: 3 }) as any)[k],
    } as any);

    const result = await engine.run({
      userId: 'u1',
      llmConfig: mockLlmConfig,
      systemPrompt: 'sys',
      messages: [{ role: 'USER', content: 'oi' }],
      persist,
    });

    expect(result.content).toBe('Resposta mock.');
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      role: 'ASSISTANT',
      content: 'Resposta mock.',
    });
  });

  it('usa cfg.model e cfg.params.temperature ao chamar o LLM provider', async () => {
    const complete = jest.fn().mockResolvedValue({
      choices: [
        {
          message: { role: 'assistant', content: 'ok', tool_calls: [] },
          finish_reason: 'stop',
        },
      ],
    });
    const llm = { complete } as any;
    const registry = {
      getOpenAiSchemas: () => [],
      getHandler: () => null,
    } as any;
    const cfg = {
      ...mockLlmConfig,
      model: 'gpt-4-custom',
      params: { temperature: 0.42 },
    };
    const engine = new ConversationEngine(llm, registry, {
      get: () => 3,
    } as any);

    await engine.run({
      userId: 'u1',
      llmConfig: cfg,
      systemPrompt: 'sys',
      messages: [{ role: 'USER', content: 'oi' }],
      persist: async (m: any) => m,
    });

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4-custom',
        temperature: 0.42,
      }),
    );
  });
});

describe('ConversationEngine.run (com tool)', () => {
  it('persiste assistant(toolCallId) + tool + assistant final', async () => {
    const persisted: any[] = [];
    const persist = jest.fn(async (m) => {
      persisted.push(m);
      return { ...m, id: `m${persisted.length}` };
    });

    const llm = new MockLlmProvider();
    const registry = {
      getOpenAiSchemas: () => [
        {
          type: 'function',
          function: { name: 'get_full_document', parameters: {} },
        },
      ],
      getHandler: () => async (_args: unknown, _ctx: { userId: string }) => ({
        extractedText: 'Texto X',
      }),
    } as any;
    const engine = new ConversationEngine(llm, registry, {
      get: () => 3,
    } as any);

    const result = await engine.run({
      userId: 'u1',
      llmConfig: mockLlmConfig,
      systemPrompt: '<document id="abc"></document>',
      messages: [{ role: 'USER', content: 'qual o valor total?' }],
      persist,
    });

    expect(result.content).toBe('Encontrei essa informação no documento.');
    expect(persisted).toHaveLength(3);
    expect(persisted[0].role).toBe('ASSISTANT');
    expect(persisted[0].toolCallId).toBeDefined();
    expect(persisted[1].role).toBe('TOOL');
    expect(persisted[1].content).toContain('extractedText');
    expect(persisted[2].role).toBe('ASSISTANT');
    expect(persisted[2].content).toBe(
      'Encontrei essa informação no documento.',
    );
  });

  it('lança tool_loop_exceeded após CHAT_MAX_TOOL_ITERATIONS', async () => {
    const llm = {
      complete: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [
                {
                  id: 'c1',
                  type: 'function',
                  function: {
                    name: 'get_full_document',
                    arguments: '{"documentId":"x"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      }),
    } as any;
    const registry = {
      getOpenAiSchemas: () => [],
      getHandler: () => async () => ({ extractedText: 'x' }),
    } as any;
    const engine = new ConversationEngine(llm, registry, {
      get: () => 3,
    } as any);

    await expect(
      engine.run({
        userId: 'u1',
        llmConfig: mockLlmConfig,
        systemPrompt: 'sys',
        messages: [{ role: 'USER', content: 'q' }],
        persist: async (m: any) => m,
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('ChatService LlmConfig.CHAT consumption', () => {
  const makePrisma = () => ({
    chatSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    document: { findFirst: jest.fn(), findMany: jest.fn() },
  });

  it('sendWorkspaceMessage falha (500) quando não há LlmConfig.CHAT ativa', async () => {
    const prisma: any = makePrisma();
    prisma.chatSession.findFirst.mockResolvedValue({ id: 's1', title: null });
    prisma.chatMessage.create.mockResolvedValue({});
    prisma.chatMessage.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    const llmConfigService = makeLlmConfigService(null);
    const engine = new ConversationEngine(
      new MockLlmProvider(),
      { getOpenAiSchemas: () => [], getHandler: () => null } as any,
      { get: () => 20 } as any,
    );
    const svc = new ChatService(
      prisma,
      { get: () => 20 } as any,
      llmConfigService,
      engine,
    );

    await expect(svc.sendWorkspaceMessage('u1', 's1', 'oi')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(llmConfigService.findActive).toHaveBeenCalledWith(LlmConfigKey.CHAT);
  });

  it('sendDocumentMessage usa cfg.prompt como base do system prompt', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst = jest.fn().mockResolvedValue({
      id: 'd1',
      filename: 'a.pdf',
      summary: { core: {}, items: [], extras: [], narrative: '' },
      status: 'READY',
    });
    prisma.chatSession.upsert = jest.fn().mockResolvedValue({ id: 's1' });
    prisma.chatMessage.create = jest.fn().mockResolvedValue({});
    prisma.chatMessage.findMany = jest.fn().mockResolvedValue([]);

    const complete = jest.fn().mockResolvedValue({
      choices: [
        {
          message: { role: 'assistant', content: 'ok', tool_calls: [] },
          finish_reason: 'stop',
        },
      ],
    });
    const llm = { complete } as any;
    const customPrompt = 'CUSTOM_CHAT_PROMPT_FROM_DB';
    const cfg = { ...mockLlmConfig, prompt: customPrompt };

    const engine = new ConversationEngine(
      llm,
      { getOpenAiSchemas: () => [], getHandler: () => null } as any,
      { get: () => 20 } as any,
    );
    const svc = new ChatService(
      prisma,
      { get: () => 20 } as any,
      makeLlmConfigService(cfg),
      engine,
    );
    await svc.sendDocumentMessage('u1', 'd1', 'oi');

    const sysMsg = complete.mock.calls[0][0].messages.find(
      (m: any) => m.role === 'system',
    );
    expect(sysMsg.content).toContain(customPrompt);
  });
});

describe('ChatService session ops', () => {
  const makePrisma = () => ({
    chatSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    document: { findMany: jest.fn() },
  });

  it('createSession retorna { id, createdAt }', async () => {
    const prisma = makePrisma();
    prisma.chatSession.create.mockResolvedValue({
      id: 's1',
      createdAt: new Date(),
    });
    const svc = new ChatService(
      prisma as any,
      { get: () => 20 } as any,
      makeLlmConfigService(),
      { run: jest.fn() } as any,
    );
    const r = await svc.createSession('u1');
    expect(prisma.chatSession.create).toHaveBeenCalledWith({
      data: { userId: 'u1' },
      select: { id: true, createdAt: true },
    });
    expect(r).toHaveProperty('id', 's1');
  });

  it('listMessages 404 quando sessão não é do user', async () => {
    const prisma = makePrisma();
    prisma.chatSession.findFirst.mockResolvedValue(null);
    const svc = new ChatService(
      prisma as any,
      { get: () => 20 } as any,
      makeLlmConfigService(),
      { run: jest.fn() } as any,
    );
    await expect(svc.listMessages('u1', 's1', false)).rejects.toThrow(
      'Not Found',
    );
  });
});

describe('ChatService document ops', () => {
  const makePrisma = () => ({
    chatSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    document: { findMany: jest.fn() },
  });

  it('sendDocumentMessage 409 quando doc.status ≠ READY', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst = jest
      .fn()
      .mockResolvedValue({ id: 'd1', status: 'OCR_RUNNING' });
    const svc = new ChatService(
      prisma,
      { get: () => 20 } as any,
      makeLlmConfigService(),
      { run: jest.fn() } as any,
    );
    await expect(
      svc.sendDocumentMessage('u1', 'd1', 'oi'),
    ).rejects.toMatchObject({
      response: { code: 'document_not_ready' },
    });
  });

  it('sendDocumentMessage faz upsert na sessão (userId, documentId)', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst = jest.fn().mockResolvedValue({
      id: 'd1',
      filename: 'a.pdf',
      summary: {},
      status: 'READY',
    });
    prisma.chatSession.upsert = jest.fn().mockResolvedValue({ id: 's1' });
    prisma.chatMessage.create = jest.fn().mockResolvedValue({});
    prisma.chatMessage.findMany = jest.fn().mockResolvedValue([]);
    const llm = new MockLlmProvider();
    const registry = {
      getOpenAiSchemas: () => [],
      getHandler: () => null,
    } as any;

    const engine = new ConversationEngine(llm, registry, {
      get: () => 20,
    } as any);
    const svc = new ChatService(
      prisma,
      { get: () => 20 } as any,
      makeLlmConfigService(),
      engine,
    );
    await svc.sendDocumentMessage('u1', 'd1', 'oi');

    expect(prisma.chatSession.upsert).toHaveBeenCalledWith({
      where: { userId_documentId: { userId: 'u1', documentId: 'd1' } },
      create: { userId: 'u1', documentId: 'd1' },
      update: {},
    });
  });

  it('clearDocumentMessages é no-op quando sessão não existe', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst = jest.fn().mockResolvedValue({ id: 'd1' });
    prisma.chatSession.findFirst = jest.fn().mockResolvedValue(null);
    prisma.chatMessage.deleteMany = jest.fn();
    const svc = new ChatService(
      prisma,
      { get: () => 20 } as any,
      makeLlmConfigService(),
      { run: jest.fn() } as any,
    );
    await svc.clearDocumentMessages('u1', 'd1');
    expect(prisma.chatMessage.deleteMany).not.toHaveBeenCalled();
  });
});
