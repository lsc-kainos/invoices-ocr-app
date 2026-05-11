'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Message } from './chat-panel';

type Session = { id: string; title: string | null; createdAt?: string; updatedAt: string };

type MessageFetchError = Error & { status?: number };

const TEMP_MESSAGE_ID_PREFIXES = ['tmp-', 'asst-'];

function isTemporaryMessage(message: Message) {
  return TEMP_MESSAGE_ID_PREFIXES.some((prefix) => message.id.startsWith(prefix));
}

function mergeFetchedMessages(fetchedMessages: Message[], cachedMessages?: Message[]) {
  if (!cachedMessages) return fetchedMessages;

  const merged = [...fetchedMessages];
  const matchedFetchedIndexes = new Set<number>();

  for (const cachedMessage of cachedMessages) {
    const exactMatch = merged.some((message) => message.id === cachedMessage.id);
    if (exactMatch) continue;

    if (isTemporaryMessage(cachedMessage)) {
      const canonicalMatchIndex = fetchedMessages.findIndex(
        (message, index) =>
          !matchedFetchedIndexes.has(index) &&
          message.role === cachedMessage.role &&
          message.content === cachedMessage.content,
      );

      if (canonicalMatchIndex >= 0) {
        matchedFetchedIndexes.add(canonicalMatchIndex);
        continue;
      }
    }

    merged.push(cachedMessage);
  }

  return merged;
}

export function useWorkspaceChat(activeSessionId?: string) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache de mensagens por sessão — evita re-fetch ao navegar entre sessões
  // já visitadas. Map vive enquanto o hook estiver montado (rota /chat).
  const messageCache = useRef<Map<string, Message[]>>(new Map());
  // Compartilha a mesma Promise entre todos os efeitos interessados naquela
  // sessão. Um Set só informava que havia request em voo, mas não permitia que
  // uma navegação de volta para a mesma sessão aguardasse o resultado; quando o
  // primeiro efeito já tinha sido limpo, o histórico era cacheado sem hidratar a
  // tela atual.
  const inFlight = useRef<Map<string, Promise<Message[]>>>(new Map());
  const activeSessionIdRef = useRef(activeSessionId);

  useLayoutEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Lista de sessões busca apenas no mount. Para evitar pressão no throttle,
  // NÃO refazer fetch em cada troca de sessão. O hook mantém a lista coerente
  // via update otimista em createSession e refetch pontual em send.
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
      Promise.resolve().then(() => {
        if (alive) setMessages([]);
      });
      return () => {
        alive = false;
      };
    }

    const cached = messageCache.current.get(activeSessionId);
    if (cached) {
      Promise.resolve(cached).then((data) => {
        if (alive) {
          setError(null);
          setMessages(data);
        }
      });
      return () => {
        alive = false;
      };
    }

    let request = inFlight.current.get(activeSessionId);
    if (!request) {
      request = fetch(`/api/chat/sessions/${activeSessionId}/messages`).then(async (r) => {
        if (!r.ok) {
          const fetchError: MessageFetchError = new Error(`http_${r.status}`);
          fetchError.status = r.status;
          throw fetchError;
        }
        const data: Message[] = await r.json();
        const mergedMessages = mergeFetchedMessages(
          data,
          messageCache.current.get(activeSessionId),
        );
        messageCache.current.set(activeSessionId, mergedMessages);
        return mergedMessages;
      });
      inFlight.current.set(activeSessionId, request);
      void request.then(
        () => {
          if (inFlight.current.get(activeSessionId) === request) {
            inFlight.current.delete(activeSessionId);
          }
        },
        () => {
          if (inFlight.current.get(activeSessionId) === request) {
            inFlight.current.delete(activeSessionId);
          }
        },
      );
    }

    request
      .then((data) => {
        if (alive) {
          setError(null);
          setMessages(data);
        }
      })
      .catch((e: MessageFetchError) => {
        if (alive) {
          // Não limpar mensagens em erro (ex: 429) — manter o que está na tela.
          setError(e.status === 429 ? 'error_rate_limit' : 'error_generic');
        }
      });

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
      const targetSessionId = activeSessionId;
      setError(null);
      setLoading(true);
      const userMsg: Message = { id: `tmp-${Date.now()}`, role: 'USER', content };
      const cachedMessages = messageCache.current.get(targetSessionId) ?? [];
      const optimisticMessages = [...cachedMessages, userMsg];
      messageCache.current.set(targetSessionId, optimisticMessages);
      if (activeSessionIdRef.current === targetSessionId) {
        setMessages(optimisticMessages);
      }

      try {
        const res = await fetch(`/api/chat/sessions/${targetSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`http_${res.status}`);
        const { content: asst } = await res.json();
        const currentCache = messageCache.current.get(targetSessionId) ?? optimisticMessages;
        const updated: Message[] = [
          ...currentCache,
          { id: `asst-${Date.now()}`, role: 'ASSISTANT', content: asst },
        ];
        messageCache.current.set(targetSessionId, updated);
        if (activeSessionIdRef.current === targetSessionId) {
          setMessages(updated);
        }
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
