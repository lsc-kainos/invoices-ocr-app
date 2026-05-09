'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Message } from './chat-panel';

type Session = { id: string; title: string | null; createdAt?: string; updatedAt: string };

export function useWorkspaceChat(activeSessionId?: string) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then((r) => (r.ok ? r.json() : []))
      .then(setSessions)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      Promise.resolve([]).then(setMessages);
      return;
    }
    fetch(`/api/chat/sessions/${activeSessionId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .catch(() => undefined);
  }, [activeSessionId]);

  const createSession = useCallback(async () => {
    const res = await fetch('/api/chat/sessions', { method: 'POST' });
    if (!res.ok) return;
    const { id } = await res.json();
    router.push(`/chat/${id}`);
  }, [router]);

  const send = useCallback(
    async (content: string) => {
      if (!activeSessionId) return;
      setError(null);
      setLoading(true);
      const userMsg: Message = { id: `tmp-${Date.now()}`, role: 'USER', content };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch(`/api/chat/sessions/${activeSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`http_${res.status}`);
        const { content: asst } = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: `asst-${Date.now()}`, role: 'ASSISTANT', content: asst },
        ]);
        fetch('/api/chat/sessions')
          .then((r) => (r.ok ? r.json() : []))
          .then(setSessions);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'unknown');
      } finally {
        setLoading(false);
      }
    },
    [activeSessionId],
  );

  return { sessions, messages, loading, error, createSession, send };
}
