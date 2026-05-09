import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Login } from '@/components/features/login/login';

export const metadata = { title: 'Entrar · Invoices' };

// User com sessão válida que vier ao /login (URL direta, link antigo, etc)
// é redirecionado pra home antes de renderizar qualquer form.
export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/');

  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
