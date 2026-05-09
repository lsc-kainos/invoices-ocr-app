import { ChatRole } from '@prisma/client';

type SessionWithMessages = {
  messages: Array<{ role: ChatRole; content: string; createdAt: Date }>;
};

export function buildChatTranscript(
  doc: { id: string; filename: string },
  session: SessionWithMessages | null,
): string {
  const count = session?.messages.length ?? 0;
  const header = [
    `# Transcript da conversa — ${doc.filename}`,
    '',
    `_Gerado em: ${new Date().toISOString()}_`,
    `_Documento: ${doc.filename} (${doc.id})_`,
    `_Total de mensagens: ${count}_`,
    '',
    '---',
    '',
  ].join('\n');

  if (!session || session.messages.length === 0) {
    return header + '_Nenhuma conversa neste documento ainda._\n';
  }

  const body = session.messages
    .map((m) => {
      const role = m.role === ChatRole.USER ? 'Você' : 'Assistente';
      return `## ${role}\n\n${m.content}\n`;
    })
    .join('\n');

  return header + body;
}
