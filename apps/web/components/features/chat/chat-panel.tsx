'use client';
import { useRef, useState, useEffect } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="to-muted/10 flex h-full flex-col bg-gradient-to-b from-transparent via-transparent">
      {empty ? (
        <EmptyChatState suggestions={suggestions ?? []} onPick={onSend} />
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
          {messages.map((m) => (
            <ChatMessageContent key={m.id} message={m} />
          ))}
          {loading && (
            <div className="text-muted-foreground flex items-center gap-3">
              <div className="flex gap-1">
                <span className="bg-primary/60 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                <span className="bg-primary/60 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                <span className="bg-primary/60 h-2 w-2 animate-bounce rounded-full" />
              </div>
              <span className="text-xs font-medium">{t('loading')}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mx-3 mb-2 rounded-lg border px-4 py-3 text-sm sm:mx-4">
          {t('error_generic')}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-border/30 bg-background/80 border-t p-3 backdrop-blur-sm sm:p-4"
      >
        <div className="border-border/50 bg-muted/40 focus-within:border-primary/40 focus-within:bg-muted/60 flex items-end gap-2 rounded-xl border px-3 py-2.5 transition-all focus-within:shadow-[0_0_20px_-5px_var(--primary)] sm:px-4 sm:py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder ?? t('placeholder')}
            disabled={loading}
            className="text-foreground placeholder:text-muted-foreground/60 min-h-[24px] flex-1 bg-transparent py-0.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t('send')}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/40 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100 sm:h-8 sm:w-8"
          >
            <Send className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
        {onClear && messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground/60 hover:text-muted-foreground mt-2 text-xs transition-colors"
          >
            {t('clear')}
          </button>
        )}
      </form>
    </div>
  );
}
