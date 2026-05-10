'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { WorkspaceSidebar } from '@/components/features/chat/workspace-sidebar';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function WorkspaceChatPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('chat');
  const { sessions, messages, loading, error, createSession, send } = useWorkspaceChat(id);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <WorkspaceSidebar sessions={sessions} activeId={id} onCreate={createSession} />
      <main className="flex-1">
        <ChatPanel
          messages={messages}
          loading={loading}
          error={error}
          onSend={send}
          suggestions={[
            t('suggestion_workspace_1'),
            t('suggestion_workspace_2'),
            t('suggestion_workspace_3'),
          ]}
        />
      </main>
    </div>
  );
}
