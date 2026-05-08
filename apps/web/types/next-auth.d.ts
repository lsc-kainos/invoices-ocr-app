import type { Role } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
  interface User {
    id: string;
    role?: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    email?: string;
    role?: Role;
  }
}
