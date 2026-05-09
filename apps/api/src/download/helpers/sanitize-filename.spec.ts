import { sanitizeFilenameForZip } from './sanitize-filename';

describe('sanitizeFilenameForZip', () => {
  it('remove extensão', () =>
    expect(sanitizeFilenameForZip('a.pdf')).toBe('a'));

  it('remove caracteres proibidos', () => {
    expect(sanitizeFilenameForZip('a/b\\c:d*e?f<g>h.pdf')).toMatch(
      /^[^/\\:*?<>|]+$/,
    );
  });

  it('normaliza acentos via NFKD', () => {
    expect(sanitizeFilenameForZip('Pão de Açúcar.pdf')).toBe('Pao de Acucar');
  });

  it('trunca em 100 chars', () => {
    const long = 'a'.repeat(150);
    expect(sanitizeFilenameForZip(long).length).toBeLessThanOrEqual(100);
  });

  it('fallback "documento" quando vazio', () => {
    expect(sanitizeFilenameForZip('???.pdf')).toBe('documento');
  });
});
