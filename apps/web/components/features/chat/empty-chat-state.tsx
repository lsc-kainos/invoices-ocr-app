'use client';
import { useTranslations } from 'next-intl';

export function EmptyChatState({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  const t = useTranslations('chat');
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h3 className="text-lg font-medium">{t('empty_state_title')}</h3>
      <p className="text-muted-foreground text-sm">{t('empty_state_subtitle')}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
