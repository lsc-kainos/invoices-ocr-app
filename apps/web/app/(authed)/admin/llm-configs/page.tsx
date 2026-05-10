import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LlmConfigsPage } from '@/components/features/llm-configs/llm-configs-page';

export const dynamic = 'force-dynamic';

export default async function AdminLlmConfigsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/');
  return <LlmConfigsPage />;
}
