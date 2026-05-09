import { secretFingerprint } from './secret-fingerprint';

describe('secretFingerprint', () => {
  it('produz output determinístico para mesmo input', () => {
    const a = secretFingerprint('s'.repeat(32));
    const b = secretFingerprint('s'.repeat(32));
    expect(a).toBe(b);
  });

  it('produz output diferente para inputs diferentes', () => {
    const a = secretFingerprint('a'.repeat(32));
    const b = secretFingerprint('b'.repeat(32));
    expect(a).not.toBe(b);
  });

  it('retorna 8 chars hex (não vaza o secret)', () => {
    const fp = secretFingerprint('any-secret-value-here');
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  // Sanidade: 1 byte de diferença no secret → fingerprint completamente
  // diferente. Evita "fingerprint parece igual visualmente mas não é".
  it('muda completamente se 1 byte do secret muda', () => {
    const a = secretFingerprint('abcdefghijklmnopqrstuvwxyz012345');
    const b = secretFingerprint('abcdefghijklmnopqrstuvwxyz012346');
    expect(a).not.toBe(b);
  });
});
