import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pdfToImage } from './pdf-to-image';

describe('pdfToImage', () => {
  it('converte PDF válido em PNG buffer (1ª página)', async () => {
    const pdfPath = join(
      process.cwd(),
      '..',
      '..',
      'samples',
      'invoice-en.pdf',
    );
    const pdf = readFileSync(pdfPath);
    const png = await pdfToImage(pdf);
    expect(png.length).toBeGreaterThan(0);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
    expect(png[2]).toBe(0x4e);
    expect(png[3]).toBe(0x47);
  }, 20_000);

  it('PDF inválido → lança erro classificável como invalid_image', async () => {
    await expect(pdfToImage(Buffer.from('not a pdf'))).rejects.toThrow(
      /invalid_image/,
    );
  });
});
