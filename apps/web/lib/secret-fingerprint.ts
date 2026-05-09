import { createHmac } from 'node:crypto';

// HMAC-SHA256(secret, 'fingerprint') → primeiros 8 chars hex.
// Determinístico e irreversível. Cópia idêntica do helper da API —
// imprimir o mesmo fingerprint nos dois services prova que o secret
// resolveu pro mesmo valor em ambos.
export function secretFingerprint(secret: string): string {
  return createHmac('sha256', secret).update('fingerprint').digest('hex').slice(0, 8);
}
