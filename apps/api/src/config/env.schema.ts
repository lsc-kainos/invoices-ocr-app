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

    // Service-to-service token usado pelo web pra chamar endpoints
    // internos da API (ex: sync de usuário no fluxo de login do NextAuth).
    INTERNAL_SERVICE_TOKEN: z
      .string()
      .min(32, 'INTERNAL_SERVICE_TOKEN deve ter pelo menos 32 chars'),

    // CSV de emails que recebem role ADMIN no upsert. String vazia = sem
    // admins. Migrado do web pra cá porque a determinação de role é
    // regra de negócio do backend.
    ADMIN_EMAILS: z.string().optional().default(''),

    // F2 — OCR / Storage
    // String vazia é tratada como ausente (.env mantém o nome da var como
    // placeholder em dev local sem chave configurada).
    OPENAI_API_KEY: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().min(1).optional(),
    ),
    OCR_PROVIDER: z.enum(['openai', 'mock']).default('mock'),
    OCR_MODEL: z.string().default('gpt-4o'),
    VOLUME_ROOT: z.string().min(1, 'VOLUME_ROOT é obrigatório'),
    STORAGE_URL_SECRET: z
      .string()
      .min(32, 'STORAGE_URL_SECRET deve ter pelo menos 32 chars'),
    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10_485_760),

    // F3 — Chat / LLM
    CHAT_MODEL: z.string().default('gpt-4o-mini'),
    CHAT_STREAMING: z
      .preprocess((v) => v === 'true' || v === true, z.boolean())
      .default(false),
    CHAT_MAX_HISTORY: z.coerce.number().int().min(1).default(20),
    CHAT_MAX_TOOL_ITERATIONS: z.coerce.number().int().min(1).default(3),
    LLM_PROVIDER: z.enum(['openai', 'mock']).default('openai'),
  })
  .superRefine((env, ctx) => {
    if (env.OCR_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY é obrigatória quando OCR_PROVIDER=openai',
      });
    }
    if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY é obrigatória quando LLM_PROVIDER=openai',
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
