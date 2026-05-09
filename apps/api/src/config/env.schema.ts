import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().url(),
    ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS é obrigatório'),
    NEXTAUTH_SECRET: z
      .string()
      .min(32, 'NEXTAUTH_SECRET deve ter pelo menos 32 chars'),

    // F2 — OCR / Storage
    OPENAI_API_KEY: z.string().min(1).optional(),
    OCR_PROVIDER: z.enum(['openai', 'mock']).default('mock'),
    OCR_MODEL: z.string().default('gpt-4o'),
    VOLUME_ROOT: z.string().min(1, 'VOLUME_ROOT é obrigatório'),
    STORAGE_URL_SECRET: z
      .string()
      .min(32, 'STORAGE_URL_SECRET deve ter pelo menos 32 chars'),
    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10_485_760),
  })
  .superRefine((env, ctx) => {
    if (env.OCR_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY é obrigatória quando OCR_PROVIDER=openai',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Env inválida:\n${issues}`);
  }
  return parsed.data;
}
