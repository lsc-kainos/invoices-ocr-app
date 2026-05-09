import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkRunner } from '@/components/features/benchmark/benchmark-runner';

export const dynamic = 'force-dynamic';

export default async function AdminBenchmarkPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/');
  return <BenchmarkRunner />;
}
