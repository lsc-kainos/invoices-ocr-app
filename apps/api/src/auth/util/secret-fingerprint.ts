import { createHmac } from 'node:crypto';

// HMAC-SHA256(secret, 'fingerprint') → primeiros 8 chars hex.
// Determinístico (mesma entrada → mesma saída) e irreversível (não dá
// pra recuperar o secret a partir do fingerprint). Serve só pra
// comparar visualmente entre serviços (web vs api) se ambos têm o
// MESMO valor de NEXTAUTH_SECRET sem expor o secret nos logs.
export function secretFingerprint(secret: string): string {
  return createHmac('sha256', secret)
    .update('fingerprint')
    .digest('hex')
    .slice(0, 8);
}
