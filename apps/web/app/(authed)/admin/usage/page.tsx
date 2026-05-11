import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UsagePage } from '@/components/features/usage/usage-page';

export const dynamic = 'force-dynamic';

export default async function AdminUsagePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/');
  return <UsagePage />;
}
