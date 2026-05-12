'use client';
import { useTranslations } from 'next-intl';
import { MessageSquareText, PanelLeft } from 'lucide-react';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { WorkspaceSidebar, SidebarContent } from '@/components/features/chat/workspace-sidebar';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function WorkspaceChatDetailClient({ id }: { id: string }) {
  const t = useTranslations('chat');
  const { sessions, messages, loading, error, createSession, send } = useWorkspaceChat(id);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Desktop sidebar */}
      <WorkspaceSidebar sessions={sessions} activeId={id} onCreate={createSession} />

      <main className="relative flex flex-1 flex-col">
        {/* Mobile sidebar sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t('show_conversations')}
              className="hover:bg-secondary/40 text-muted-foreground hover:text-foreground absolute top-3 left-3 z-40 inline-flex size-9 items-center justify-center rounded-md transition-colors lg:hidden"
            >
              <PanelLeft size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="pt-12">
            <div className="flex h-full flex-col overflow-hidden">
              <SidebarContent sessions={sessions} activeId={id} onCreate={createSession} />
            </div>
          </SheetContent>
        </Sheet>

        <header className="border-border/50 bg-background/80 border-b px-14 py-3 backdrop-blur-sm sm:px-16 lg:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
              <MessageSquareText size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">{t('workspace_title')}</h1>
              <p className="text-muted-foreground text-[12px]">{t('workspace_subtitle')}</p>
            </div>
          </div>
        </header>

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
