import { encodeRFC5987 } from './encode-rfc5987';

describe('encodeRFC5987', () => {
  it('ASCII: passthrough', () => {
    expect(encodeRFC5987('foo.pdf')).toBe('foo.pdf');
  });

  it('com espaço: encodeURI', () => {
    expect(encodeRFC5987('foo bar.pdf')).toBe('foo%20bar.pdf');
  });

  it('acentos: percent encode UTF-8', () => {
    expect(encodeRFC5987('construção.pdf')).toMatch(
      /^constru%C3%A7%C3%A3o\.pdf$/i,
    );
  });

  it('aspas: encoded', () => {
    expect(encodeRFC5987('a"b.pdf')).toBe('a%22b.pdf');
  });
});
