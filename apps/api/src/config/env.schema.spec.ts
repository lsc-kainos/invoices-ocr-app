import { validateEnv } from './env.schema';

const validRaw = {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL: 'postgresql://invoices:invoices@localhost:5432/invoices',
  ALLOWED_ORIGINS: 'http://localhost:3000',
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
});
