'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PanelLeft } from 'lucide-react';
import { ChatPanel } from '@/components/features/chat/chat-panel';
import { WorkspaceSidebar, SidebarContent } from '@/components/features/chat/workspace-sidebar';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function WorkspaceChatPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('chat');
  const { sessions, messages, loading, error, createSession, send } = useWorkspaceChat(id);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Desktop sidebar */}
      <WorkspaceSidebar sessions={sessions} activeId={id} onCreate={createSession} />

      <main className="relative flex-1">
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
