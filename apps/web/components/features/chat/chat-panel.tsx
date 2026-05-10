'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { ChatMessageContent } from './chat-message-content';
import { EmptyChatState } from './empty-chat-state';

export type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
};

type Props = {
  messages: Message[];
  loading: boolean;
  error?: string | null;
  onSend: (text: string) => void;
  onClear?: () => void;
  suggestions?: string[];
  placeholder?: string;
};

export function ChatPanel({
  messages,
  loading,
  error,
  onSend,
  onClear,
  suggestions,
  placeholder,
}: Props) {
  const t = useTranslations('chat');
  const [input, setInput] = useState('');
  const empty = messages.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      {empty ? (
        <EmptyChatState suggestions={suggestions ?? []} onPick={onSend} />
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((m) => (
            <ChatMessageContent key={m.id} message={m} />
          ))}
          {loading && <div className="text-muted-foreground text-sm italic">{t('loading')}</div>}
        </div>
      )}

      {error && <p className="text-destructive px-4 py-2 text-sm">{t('error_generic')}</p>}

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder ?? t('placeholder')}
            disabled={loading}
            className="flex-1 rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t('send')}
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {onClear && messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground mt-2 text-xs hover:underline"
          >
            {t('clear')}
          </button>
        )}
      </form>
    </div>
  );
}
