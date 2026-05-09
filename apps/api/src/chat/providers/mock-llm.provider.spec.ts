import { MockLlmProvider } from './mock-llm.provider';

describe('MockLlmProvider', () => {
  const provider = new MockLlmProvider();

  it('retorna canned reply quando user msg não cita tool keywords', async () => {
    const resp = (await provider.complete({
      model: 'mock',
      tools: [],
      messages: [{ role: 'user', content: 'Olá' }],
    })) as any;
    expect(resp.choices[0].message.content).toBe('Resposta mock.');
    expect(resp.choices[0].message.tool_calls).toBeUndefined();
  });

  it('dispara tool_call quando user msg menciona "valor total"', async () => {
    const resp = (await provider.complete({
      model: 'mock',
      tools: [],
      messages: [
        { role: 'system', content: '<document id="abc123">...' },
        { role: 'user', content: 'qual o valor total?' },
      ],
    })) as any;
    expect(resp.choices[0].message.tool_calls).toHaveLength(1);
    expect(resp.choices[0].message.tool_calls[0].function.name).toBe(
      'get_full_document',
    );
    expect(
      JSON.parse(resp.choices[0].message.tool_calls[0].function.arguments),
    ).toEqual({
      documentId: 'abc123',
    });
  });

  it('retorna mensagem final canned após receber tool result', async () => {
    const resp = (await provider.complete({
      model: 'mock',
      tools: [],
      messages: [
        { role: 'user', content: 'qual o valor total?' },
        {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              id: 'c1',
              type: 'function',
              function: { name: 'get_full_document', arguments: '{}' },
            },
          ],
        },
        {
          role: 'tool',
          tool_call_id: 'c1',
          content: '{"extractedText":"Valor: R$ 100"}',
        },
      ],
    })) as any;
    expect(resp.choices[0].message.content).toBe(
      'Encontrei essa informação no documento.',
    );
  });
});
