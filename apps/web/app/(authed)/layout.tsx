import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Topbar } from '@/components/layout/topbar';
import { ActiveUploadsProvider } from '@/components/features/active-uploads/active-uploads-provider';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar user={session.user} />
      <ActiveUploadsProvider>
        <main className="flex-1">{children}</main>
      </ActiveUploadsProvider>
    </div>
  );
}
