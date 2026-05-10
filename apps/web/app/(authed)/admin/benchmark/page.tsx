import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkPage } from '@/components/features/benchmark/benchmark-page';

export const dynamic = 'force-dynamic';

export default async function AdminBenchmarkPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/');
  return <BenchmarkPage />;
}
