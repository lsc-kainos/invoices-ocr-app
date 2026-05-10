'use client';
import { useTranslations } from 'next-intl';
import { WorkspaceSidebar } from '@/components/features/chat/workspace-sidebar';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function ChatIndex() {
  const t = useTranslations('chat');
  const { sessions, createSession } = useWorkspaceChat(undefined);
  const hasSessions = sessions.length > 0;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <WorkspaceSidebar sessions={sessions} onCreate={createSession} />
      <main
        className="flex flex-1 items-center justify-center"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 40%, oklch(0.15 0.06 40 / 0.06) 0%, transparent 60%)',
        }}
      >
        <div className="max-w-md px-4 text-center sm:px-6">
          <h2 className="text-foreground mb-2 text-lg font-medium">
            {hasSessions ? t('select_conversation_title') : t('empty_state_title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {hasSessions ? t('select_conversation_subtitle') : t('no_sessions')}
          </p>
          <button
            onClick={createSession}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/40 mt-4 h-11 w-full rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all hover:scale-105 active:scale-95 sm:h-9 sm:w-auto"
          >
            {t('new_conversation')}
          </button>
        </div>
      </main>
    </div>
  );
}
