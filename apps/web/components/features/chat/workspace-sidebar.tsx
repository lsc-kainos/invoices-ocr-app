'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
      <button
        onClick={onCreate}
        className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 m-3 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all"
      >
        <Plus className="h-4 w-4" />
        {t('new_conversation')}
      </button>
      <nav className="flex-1 overflow-y-auto px-2">
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
              className={`block truncate rounded-lg px-3 py-2 text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 border-l-primary text-foreground border-l-2 font-medium'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
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
