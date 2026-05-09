import { mimeToExt } from './mime-to-ext';

describe('mimeToExt', () => {
  it.each([
    ['application/pdf', 'pdf'],
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['unknown/x', 'bin'],
  ])('%s → %s', (mime, expected) => {
    expect(mimeToExt(mime)).toBe(expected);
  });
});
