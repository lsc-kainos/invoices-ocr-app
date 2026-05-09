import { mimeToExt } from './mime-to-ext';

describe('mimeToExt', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['application/pdf', 'pdf'],
  ])('%s → %s', (mime, ext) => expect(mimeToExt(mime)).toBe(ext));

  it('mime desconhecido → bin', () => {
    expect(mimeToExt('application/octet-stream')).toBe('bin');
  });
});
