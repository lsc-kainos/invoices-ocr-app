'use client';
import { useTranslations } from 'next-intl';
import { MessageSquareText, PanelLeft, Sparkles } from 'lucide-react';
import { WorkspaceSidebar, SidebarContent } from '@/components/features/chat/workspace-sidebar';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { useWorkspaceChat } from '@/components/features/chat/use-workspace-chat';

export default function ChatIndex() {
  const t = useTranslations('chat');
  const { sessions, createSession } = useWorkspaceChat(undefined);
  const hasSessions = sessions.length > 0;

  return (
    <div className="flex h-[calc(100dvh-56px)]">
      <WorkspaceSidebar sessions={sessions} onCreate={createSession} />
      <main
        className="relative flex flex-1 flex-col"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 40%, oklch(0.15 0.06 40 / 0.06) 0%, transparent 60%)',
        }}
      >
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
              <SidebarContent sessions={sessions} onCreate={createSession} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="border-border/60 bg-card w-full rounded-xl border p-6 text-center shadow-lg shadow-black/10 sm:p-8">
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
              {hasSessions ? <MessageSquareText size={22} /> : <Sparkles size={22} />}
            </div>
            <h2 className="text-foreground mb-2 text-xl font-semibold tracking-tight">
              {hasSessions ? t('select_conversation_title') : t('empty_state_title')}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              {hasSessions ? t('select_conversation_subtitle') : t('no_sessions')}
            </p>
            <button
              onClick={createSession}
              className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/40 mt-5 h-11 w-full rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all hover:scale-[1.02] active:scale-95 sm:w-auto"
            >
              {t('new_conversation')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
