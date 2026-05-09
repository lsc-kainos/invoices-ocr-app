import { sanitizeFilename } from './sanitize-filename';

describe('sanitizeFilename', () => {
  it('mantém ASCII seguro', () => {
    expect(sanitizeFilename('NF-e_0023117.pdf')).toBe('NF-e_0023117.pdf');
  });

  it('substitui chars perigosos e remove path', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('a/b\\c')).toBe('c');
    expect(sanitizeFilename('Boleto/X.pdf')).toBe('X.pdf');
  });

  it('remove acentos', () => {
    expect(sanitizeFilename('Nota Fiscal Construção.pdf')).toBe(
      'Nota_Fiscal_Construcao.pdf',
    );
  });

  it('default para "arquivo" se vazio', () => {
    expect(sanitizeFilename('')).toBe('arquivo');
    expect(sanitizeFilename('   ')).toBe('arquivo');
  });

  it('trunca em 120 chars preservando extensão', () => {
    const long = 'a'.repeat(200) + '.pdf';
    const out = sanitizeFilename(long);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out.endsWith('.pdf')).toBe(true);
  });
});
