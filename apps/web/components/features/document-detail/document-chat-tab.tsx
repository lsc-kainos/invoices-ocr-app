'use client';
import { useTranslations } from 'next-intl';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { useDocumentChat } from '@/components/features/chat/use-document-chat';

export function DocumentChatTab({ documentId }: { documentId: string }) {
  const t = useTranslations('chat');
  const { messages, loading, error, send, clear } = useDocumentChat(documentId);
  return (
    <ChatPanel
      messages={messages}
      loading={loading}
      error={error}
      onSend={send}
      onClear={clear}
      suggestions={[
        t('suggestion_document_1'),
        t('suggestion_document_2'),
        t('suggestion_document_3'),
      ]}
    />
  );
}
