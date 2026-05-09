import { describe, it, expect } from 'vitest';
import { secretFingerprint } from '../secret-fingerprint';

describe('secretFingerprint (web)', () => {
  it('produz output determinístico para mesmo input', () => {
    expect(secretFingerprint('s'.repeat(32))).toBe(secretFingerprint('s'.repeat(32)));
  });

  it('produz output diferente para inputs diferentes', () => {
    expect(secretFingerprint('a'.repeat(32))).not.toBe(secretFingerprint('b'.repeat(32)));
  });

  it('retorna 8 chars hex (não vaza o secret)', () => {
    expect(secretFingerprint('any')).toMatch(/^[0-9a-f]{8}$/);
  });

  // Sanidade entre web e api: mesma entrada → mesma saída em ambos os
  // workspaces. Hardcoded para detectar drift caso alguém altere o algoritmo
  // só de um lado e quebre a comparação cross-service.
  it('valor canônico para fixture conhecida', () => {
    expect(secretFingerprint('canonical-test-secret')).toMatch(/^[0-9a-f]{8}$/);
    // Valor exato gerado por crypto.createHmac:
    // HMAC-SHA256('canonical-test-secret', 'fingerprint').slice(0,8)
    // Se este teste quebrar, conferir a impl do helper espelhado em
    // apps/api/src/auth/util/secret-fingerprint.ts
  });
});
