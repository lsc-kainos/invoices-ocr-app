'use client';
import { useTranslations } from 'next-intl';
import { Sparkles, MessageSquareText } from 'lucide-react';

export function EmptyChatState({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  const t = useTranslations('chat');
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-6">
      <div className="border-border/60 bg-card w-full rounded-xl border p-6 text-center shadow-lg shadow-black/10 sm:p-8">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
          <MessageSquareText size={22} />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{t('empty_state_title')}</h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          {t('empty_state_subtitle')}
        </p>
        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="border-border/30 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-3 text-sm transition-all sm:w-auto sm:px-3 sm:py-2"
            >
              <Sparkles size={12} className="text-primary/60 shrink-0" />
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
