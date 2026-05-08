import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('mascara local part preservando primeira letra e domínio', () => {
    expect(maskEmail('lsc@kainos-labs.com.br')).toBe('l***@kainos-labs.com.br');
  });

  it('retorna *** para entrada inválida', () => {
    expect(maskEmail('')).toBe('***');
    expect(maskEmail('semarroba')).toBe('***');
  });
});
