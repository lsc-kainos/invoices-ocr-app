import { OpenaiLlmProvider } from './openai-llm.provider';

describe('OpenaiLlmProvider', () => {
  it('chama client.chat.completions.create com params corretos', async () => {
    const createMock = jest.fn().mockResolvedValue({ id: 'cmpl-1' });
    const fakeClient = { chat: { completions: { create: createMock } } };
    const provider = new OpenaiLlmProvider(
      'test-key',
      'gpt-4o-mini',
      fakeClient as any,
    );

    await provider.complete({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'oi' }],
      tools: [{ type: 'function', function: { name: 'foo', parameters: {} } }],
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

  it('omite tools e tool_choice quando tools está vazio', async () => {
    const createMock = jest.fn().mockResolvedValue({ id: 'cmpl-2' });
    const fakeClient = { chat: { completions: { create: createMock } } };
    const provider = new OpenaiLlmProvider(
      'test-key',
      'gpt-4o-mini',
      fakeClient as any,
    );

    await provider.complete({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'oi' }],
      tools: [],
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: undefined,
        tool_choice: undefined,
      }),
    );
  });
});
