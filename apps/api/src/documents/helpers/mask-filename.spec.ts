import { maskFilename } from './mask-filename';

describe('maskFilename', () => {
  it('curto: retorna intacto', () => {
    expect(maskFilename('a.pdf')).toBe('a.pdf');
  });

  it('longo: prefixo + ... + sufixo', () => {
    expect(maskFilename('NF-e_0023117_construtora-vega.pdf')).toBe(
      'NF-e...vega.pdf',
    );
  });

  it('sem extensão: ainda mascara', () => {
    expect(maskFilename('aaaaaaaaaaaaaaaaaaaaaaaa')).toMatch(/^aaaa.*aaaa$/);
  });
});
