'use client';
import { useTranslations } from 'next-intl';
import { WorkspaceSidebar } from '@/components/features/chat/workspace-sidebar';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function ChatIndex() {
  const t = useTranslations('chat');
  const { sessions, createSession } = useWorkspaceChat(undefined);

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <WorkspaceSidebar sessions={sessions} onCreate={createSession} />
      <main className="flex flex-1 items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <h2 className="text-foreground mb-2 text-lg font-medium">{t('empty_state_title')}</h2>
          <p className="text-muted-foreground text-sm">{t('no_sessions')}</p>
          <button
            onClick={createSession}
            className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            {t('new_conversation')}
          </button>
        </div>
      </main>
    </div>
  );
}
