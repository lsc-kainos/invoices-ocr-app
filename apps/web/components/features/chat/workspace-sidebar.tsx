'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Session = { id: string; title: string | null; updatedAt: string };

export function WorkspaceSidebar({
  sessions,
  activeId,
  onCreate,
}: {
  sessions: Session[];
  activeId?: string;
  onCreate: () => void;
}) {
  const t = useTranslations('chat');
  return (
    <aside className="bg-muted/30 flex h-full w-80 flex-col border-r">
      <button
        onClick={onCreate}
        className="hover:bg-muted m-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
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
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/chat/${s.id}`}
            className={`block truncate rounded-md px-3 py-2 text-sm ${
              s.id === activeId ? 'bg-muted font-medium' : 'hover:bg-muted/60'
            }`}
          >
            {s.title ?? t('untitled')}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
