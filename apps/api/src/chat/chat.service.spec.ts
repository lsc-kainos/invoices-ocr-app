import { InternalServerErrorException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MockLlmProvider } from './providers/mock-llm.provider';
import { ToolsRegistry } from './tools/tools-registry';

describe('ChatService.runConversation (sem tool)', () => {
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
    const service = new ChatService(
      {} as any,
      llm,
      registry,
      {
        get: (k: string) =>
          (({ CHAT_MODEL: 'mock', CHAT_MAX_TOOL_ITERATIONS: 3 }) as any)[k],
      } as any,
      console as any,
    );

    const result = await (service as any).runConversation({
      userId: 'u1',
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
});

describe('ChatService.runConversation (com tool)', () => {
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
    const service = new ChatService({} as any, llm, registry, {
      get: () => 3,
    } as any);

    const result = await (service as any).runConversation({
      userId: 'u1',
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
    const service = new ChatService({} as any, llm, registry, {
      get: () => 3,
    } as any);

    await expect(
      (service as any).runConversation({
        userId: 'u1',
        systemPrompt: 'sys',
        messages: [{ role: 'USER', content: 'q' }],
        persist: async (m: any) => m,
      }),
    ).rejects.toThrow(InternalServerErrorException);
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
      {} as any,
      {} as any,
      { get: () => 20 } as any,
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
      {} as any,
      {} as any,
      { get: () => 20 } as any,
    );
    await expect(svc.listMessages('u1', 's1', false)).rejects.toThrow(
      'Not Found',
    );
  });
});
