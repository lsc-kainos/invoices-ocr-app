import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Topbar } from '@/components/layout/topbar';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar user={session.user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
