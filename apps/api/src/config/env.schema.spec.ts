import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validRaw = {
    NODE_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: 'postgresql://invoices:invoices@localhost:5432/invoices',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  };

  it('aceita env válida e coage PORT para number', () => {
    const env = validateEnv(validRaw);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe(validRaw.DATABASE_URL);
    expect(env.ALLOWED_ORIGINS).toBe(validRaw.ALLOWED_ORIGINS);
  });

  it('aplica default para NODE_ENV e PORT quando ausentes', () => {
    const { NODE_ENV: _node, PORT: _port, ...rest } = validRaw;
    const env = validateEnv(rest);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
  });

  it('rejeita quando DATABASE_URL está ausente', () => {
    const { DATABASE_URL: _url, ...rest } = validRaw;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('rejeita quando ALLOWED_ORIGINS está ausente', () => {
    const { ALLOWED_ORIGINS: _origins, ...rest } = validRaw;
    expect(() => validateEnv(rest)).toThrow(/ALLOWED_ORIGINS/);
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
