const FORBIDDEN = /[\x00-\x1f\x7f"\\/:*?<>|]/g;

export function sanitizeFilenameForZip(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  const ascii = base.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const cleaned = ascii.replace(FORBIDDEN, '_').trim();
  const truncated = cleaned.slice(0, 100);

  if (!truncated || /^_+$/.test(truncated)) {
    return 'documento';
  }

  return truncated;
}
