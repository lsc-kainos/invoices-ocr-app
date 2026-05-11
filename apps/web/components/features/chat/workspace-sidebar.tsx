'use client';
import Link from 'next/link';
import { MessageSquareText, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Session = { id: string; title: string | null; updatedAt: string };

interface SidebarProps {
  sessions: Session[];
  activeId?: string;
  onCreate: () => void;
}

export function SidebarContent({ sessions, activeId, onCreate }: SidebarProps) {
  const t = useTranslations('chat');
  return (
    <>
      <div className="border-border/40 border-b p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <MessageSquareText size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold">{t('sidebar_title')}</div>
            <div className="text-muted-foreground text-[11px]">{t('sidebar_subtitle')}</div>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          {t('new_conversation')}
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {sessions.length === 0 && (
          <p className="text-muted-foreground px-3 py-6 text-center text-sm">
            {t('sidebar_empty')}
          </p>
        )}
        {sessions.map((s) => {
          const isActive = s.id === activeId;
          return (
            <Link
              key={s.id}
              href={`/chat/${s.id}`}
              className={`block truncate rounded-lg border px-3 py-2 text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 border-primary/20 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border-transparent'
              }`}
            >
              {s.title ?? t('untitled')}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function WorkspaceSidebar({ sessions, activeId, onCreate }: SidebarProps) {
  return (
    <aside className="bg-background/80 border-border/30 hidden h-full w-80 flex-col border-r backdrop-blur-md lg:flex">
      <SidebarContent sessions={sessions} activeId={activeId} onCreate={onCreate} />
    </aside>
  );
}
