import { buildChatTranscript } from './chat-transcript';

describe('buildChatTranscript', () => {
  const doc = { id: 'd1', filename: 'nf.pdf' };

  it('null sessão → header + placeholder', () => {
    const out = buildChatTranscript(doc, null);
    expect(out).toContain('# Transcript da conversa — nf.pdf');
    expect(out).toContain('Total de mensagens: 0');
    expect(out).toContain('_Nenhuma conversa neste documento ainda._');
  });

  it('sessão vazia → mesmo placeholder', () => {
    const out = buildChatTranscript(doc, { messages: [] });
    expect(out).toContain('_Nenhuma conversa neste documento ainda._');
  });

  it('sessão com USER+ASSISTANT renderiza headers ## Você / ## Assistente', () => {
    const out = buildChatTranscript(doc, {
      messages: [
        { role: 'USER', content: 'Qual o valor?', createdAt: new Date() },
        { role: 'ASSISTANT', content: 'R$ 100', createdAt: new Date() },
      ],
    });
    expect(out).toContain('## Você\n\nQual o valor?');
    expect(out).toContain('## Assistente\n\nR$ 100');
    expect(out).toContain('Total de mensagens: 2');
  });
});
