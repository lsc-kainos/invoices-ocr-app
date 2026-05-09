export function titleFromContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 50) + '…';
}
