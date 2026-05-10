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

  // Lista de sessões busca apenas no mount. Para evitar pressão no throttle
  // (chat: 15 req/min), NÃO refazer fetch em cada troca de sessão. O hook
  // mantém a lista coerente via update otimista em createSession e refetch
  // pontual em send (após resposta do LLM, que pode ter mudado o título).
  useEffect(() => {
    let alive = true;
    fetch('/api/chat/sessions')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (alive) setSessions(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!activeSessionId) {
      Promise.resolve([]).then((data) => {
        if (alive) setMessages(data);
      });
      return () => {
        alive = false;
      };
    }
    fetch(`/api/chat/sessions/${activeSessionId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (alive) setMessages(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [activeSessionId]);

  const createSession = useCallback(async () => {
    const res = await fetch('/api/chat/sessions', { method: 'POST' });
    if (!res.ok) return;
    const { id, createdAt } = (await res.json()) as {
      id: string;
      createdAt: string;
    };
    // Update otimista: prepend a sessão nova na sidebar SEM refetch — evita
    // round-trip e pressão no throttle. Title vem null (preenchido na 1a
    // mensagem). Se o componente foi remontado em /chat/[id], o useEffect
    // de mount cuida; se persistiu (App Router segmento [id]), o setSessions
    // aqui é o que faz a sessão aparecer na lista.
    setSessions((prev) => [{ id, title: null, createdAt, updatedAt: createdAt }, ...prev]);
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
