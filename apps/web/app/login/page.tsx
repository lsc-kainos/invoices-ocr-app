import { Suspense } from 'react';
import { Login } from '@/components/features/login/login';

export const metadata = { title: 'Entrar · Invoices' };

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
