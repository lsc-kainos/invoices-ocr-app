'use client';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { useDocumentChat } from '@/components/features/chat/use-document-chat';

export function DocumentChatTab({ documentId }: { documentId: string }) {
  const { messages, loading, error, send, clear } = useDocumentChat(documentId);
  return (
    <ChatPanel
      messages={messages}
      loading={loading}
      error={error}
      onSend={send}
      onClear={clear}
      suggestions={['Qual o valor total?', 'Quem é o emitente?', 'Qual a chave NF-e?']}
    />
  );
}
