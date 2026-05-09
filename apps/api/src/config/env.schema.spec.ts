import { validateEnv } from './env.schema';

const validRaw = {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL: 'postgresql://invoices:invoices@localhost:5432/invoices',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'a'.repeat(32),
  VOLUME_ROOT: '/tmp/volume',
  STORAGE_URL_SECRET: 'b'.repeat(32),
};

function omit<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
): Partial<T> {
  const copy: Record<string, unknown> = { ...obj };
  delete copy[key as string];
  return copy as Partial<T>;
}

describe('validateEnv', () => {
  it('aceita env válida e coage PORT para number', () => {
    const env = validateEnv(validRaw);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe(validRaw.DATABASE_URL);
    expect(env.ALLOWED_ORIGINS).toBe(validRaw.ALLOWED_ORIGINS);
  });

  it('aplica default para NODE_ENV e PORT quando ausentes', () => {
    const env = validateEnv(omit(omit(validRaw, 'NODE_ENV'), 'PORT'));
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
  });

  it('rejeita quando DATABASE_URL está ausente', () => {
    expect(() => validateEnv(omit(validRaw, 'DATABASE_URL'))).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejeita quando ALLOWED_ORIGINS está ausente', () => {
    expect(() => validateEnv(omit(validRaw, 'ALLOWED_ORIGINS'))).toThrow(
      /ALLOWED_ORIGINS/,
    );
  });

  it('rejeita DATABASE_URL não-URL', () => {
    expect(() =>
      validateEnv({ ...validRaw, DATABASE_URL: 'not-a-url' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejeita NODE_ENV inválido', () => {
    expect(() => validateEnv({ ...validRaw, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('rejeita NEXTAUTH_SECRET ausente', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://x',
        ALLOWED_ORIGINS: 'http://localhost:3000',
        VOLUME_ROOT: '/tmp/v',
        STORAGE_URL_SECRET: 'b'.repeat(32),
      }),
    ).toThrow(/NEXTAUTH_SECRET/);
  });

  it('aceita NEXTAUTH_SECRET com 32+ chars', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://invoices:invoices@localhost:5432/invoices',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'a'.repeat(32),
      VOLUME_ROOT: '/tmp/v',
      STORAGE_URL_SECRET: 'b'.repeat(32),
    });
    expect(env.NEXTAUTH_SECRET).toHaveLength(32);
  });

  describe('F2 — OCR / Storage', () => {
    it('aceita OCR_PROVIDER=mock sem OPENAI_API_KEY', () => {
      expect(() =>
        validateEnv({ ...validRaw, OCR_PROVIDER: 'mock' }),
      ).not.toThrow();
    });

    it('exige OPENAI_API_KEY quando OCR_PROVIDER=openai', () => {
      expect(() =>
        validateEnv({ ...validRaw, OCR_PROVIDER: 'openai' }),
      ).toThrow(/OPENAI_API_KEY/);
    });

    it('aceita OCR_PROVIDER=openai com OPENAI_API_KEY', () => {
      expect(() =>
        validateEnv({
          ...validRaw,
          OCR_PROVIDER: 'openai',
          OPENAI_API_KEY: 'sk-test',
        }),
      ).not.toThrow();
    });

    it('default OCR_PROVIDER=mock, OCR_MODEL=gpt-4o, UPLOAD_MAX_BYTES=10485760', () => {
      const env = validateEnv(validRaw);
      expect(env.OCR_PROVIDER).toBe('mock');
      expect(env.OCR_MODEL).toBe('gpt-4o');
      expect(env.UPLOAD_MAX_BYTES).toBe(10_485_760);
    });

    it('rejeita STORAGE_URL_SECRET com menos de 32 chars', () => {
      expect(() =>
        validateEnv({ ...validRaw, STORAGE_URL_SECRET: 'short' }),
      ).toThrow(/STORAGE_URL_SECRET/);
    });

    it('exige VOLUME_ROOT', () => {
      expect(() => validateEnv(omit(validRaw, 'VOLUME_ROOT'))).toThrow(
        /VOLUME_ROOT/,
      );
    });
  });
});
