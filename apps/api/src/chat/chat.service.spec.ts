import { ChatService } from './chat.service';
import { MockLlmProvider } from './providers/mock-llm.provider';
import { ToolsRegistry } from './tools/tools-registry';

describe('ChatService.runConversation (sem tool)', () => {
  it('persiste user + assistant e retorna content quando LLM responde direto', async () => {
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
