const MAX_LEN = 120;
const ACCENT_MAP: Record<string, string> = {
  á: 'a',
  à: 'a',
  ã: 'a',
  â: 'a',
  ä: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ó: 'o',
  ò: 'o',
  õ: 'o',
  ô: 'o',
  ö: 'o',
  ú: 'u',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ç: 'c',
  ñ: 'n',
};

function deAccent(s: string): string {
  return s.replace(/[áàãâäéèêëíìîïóòõôöúùûüçñ]/gi, (ch) => {
    const lower = ch.toLowerCase();
    const repl = ACCENT_MAP[lower] ?? ch;
    return ch === lower ? repl : repl.toUpperCase();
  });
}

export function sanitizeFilename(input: string): string {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return 'arquivo';

  const baseOnly = trimmed.split(/[\\/]/).pop() ?? trimmed;
  const noAccent = deAccent(baseOnly).replace(/\s+/g, '_');
  const safe = noAccent.replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_');
  const finalName = safe.replace(/^[._-]+/, '') || 'arquivo';

  if (finalName.length <= MAX_LEN) return finalName;
  const dot = finalName.lastIndexOf('.');
  if (dot <= 0) return finalName.slice(0, MAX_LEN);
  const ext = finalName.slice(dot);
  return finalName.slice(0, MAX_LEN - ext.length) + ext;
}
