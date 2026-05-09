import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default async function ChatIndex() {
  try {
    const res = await apiFetch('/api/v1/chat/sessions?limit=1');
    const sessions = (res.ok ? await res.json() : []) as Array<{ id: string }>;
    if (sessions.length > 0) redirect(`/chat/${sessions[0].id}`);
  } catch {
    // apiFetch may throw if not authenticated; just show empty state
  }
  return (
    <div className="text-muted-foreground p-6 text-sm">
      Sem conversas ainda. Crie uma nova na sidebar.
    </div>
  );
}
