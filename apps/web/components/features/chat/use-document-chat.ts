'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Message } from './chat-panel';

export function useDocumentChat(documentId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/chat/documents/${documentId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (alive) setMessages(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [documentId]);

  const send = useCallback(
    async (content: string) => {
      setError(null);
      setLoading(true);
      const userMsg: Message = { id: `u-${Date.now()}`, role: 'USER', content };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch(`/api/chat/documents/${documentId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`http_${res.status}`);
        const { content: asst } = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'ASSISTANT', content: asst },
        ]);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'unknown');
      } finally {
        setLoading(false);
      }
    },
    [documentId],
  );

  const clear = useCallback(async () => {
    await fetch(`/api/chat/documents/${documentId}/messages`, { method: 'DELETE' });
    setMessages([]);
  }, [documentId]);

  return { messages, loading, error, send, clear };
}
