import { OpenaiLlmProvider } from './openai-llm.provider';

describe('OpenaiLlmProvider', () => {
  it('chama client.chat.completions.create com params corretos', async () => {
    const createMock = jest.fn().mockResolvedValue({ id: 'cmpl-1' });
    const fakeClient = { chat: { completions: { create: createMock } } };
    const provider = new OpenaiLlmProvider('test-key', 'gpt-4o-mini');
    (provider as any).client = fakeClient;

    await provider.complete({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'oi' }],
      tools: [
        { type: 'function', function: { name: 'foo', parameters: {} as any } },
      ],
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'oi' }],
        tools: [
          { type: 'function', function: { name: 'foo', parameters: {} } },
        ],
        tool_choice: 'auto',
        stream: false,
      }),
    );
  });
});
