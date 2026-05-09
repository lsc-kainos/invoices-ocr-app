export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***';
  const head = user[0] ?? '*';
  return `${head}***@${domain}`;
}
