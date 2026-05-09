import { z } from 'zod';

const schema = z.object({
  API_URL: z.string().url().default('http://localhost:3001'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  ADMIN_EMAILS: z.string().optional().default(''),
  DATABASE_URL: z.string().url(),
});

type Env = z.infer<typeof schema>;

let cached: Env | null = null;

// Durante `next build`, o Next.js avalia módulos das rotas pra coletar
// page data — mas envs do Railway só existem no runtime do container.
// Validar aqui faria o build quebrar. Pulamos a validação estrita nessa
// fase e devolvemos placeholders; o runtime valida pra valer.
function load(): Env {
  if (cached) return cached;
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    cached = {
      API_URL: process.env.API_URL ?? 'http://localhost:3001',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? '',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? '',
      ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? '',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://build:build@localhost:5432/build',
    } as Env;
    return cached;
  }
  cached = schema.parse({
    API_URL: process.env.API_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    DATABASE_URL: process.env.DATABASE_URL,
  });
  return cached;
}

export const env = new Proxy({} as Env, {
  get(_, key) {
    return load()[key as keyof Env];
  },
});
