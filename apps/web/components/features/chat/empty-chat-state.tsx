'use client';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

export function EmptyChatState({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  const t = useTranslations('chat');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
      <h3 className="text-lg font-medium">{t('empty_state_title')}</h3>
      <p className="text-muted-foreground text-center text-sm">{t('empty_state_subtitle')}</p>
      <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
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
  );
}
