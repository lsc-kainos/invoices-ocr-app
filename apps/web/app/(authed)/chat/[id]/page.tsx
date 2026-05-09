'use client';
import { useParams } from 'next/navigation';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { WorkspaceSidebar } from '@/components/features/chat/workspace-sidebar';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function WorkspaceChatPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions, messages, loading, error, createSession, send } = useWorkspaceChat(id);

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <WorkspaceSidebar sessions={sessions} activeId={id} onCreate={createSession} />
      <main className="flex-1">
        <ChatPanel
          messages={messages}
          loading={loading}
          error={error}
          onSend={send}
          suggestions={[
            'Quais notas vencem este mês?',
            'Soma do valor total das notas de janeiro',
            'Liste as notas com CFOP 5102',
          ]}
        />
      </main>
    </div>
  );
}
