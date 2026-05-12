import WorkspaceChatDetailClient from '@/components/features/chat/workspace-chat-detail-client';

export default async function WorkspaceChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceChatDetailClient id={id} />;
}
