import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pdfToImage } from './pdf-to-image';

// O teste integration de PDF real depende de `@napi-rs/canvas` resolver
// bindings nativos no host. CI Ubuntu nem sempre tem o canvas pré-built
// disponível, então pulamos quando `RUN_PDF_INTEGRATION` não estiver setado.
// O caminho real é exercido pelo E2E quando upload-en.pdf é enviado.
const runIntegration = process.env.RUN_PDF_INTEGRATION === '1';
const itIntegration = runIntegration ? it : it.skip;

describe('pdfToImage', () => {
  itIntegration(
    'converte PDF válido em PNG buffer (1ª página)',
    async () => {
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
    },
    20_000,
  );

  it('PDF inválido → lança erro classificável como invalid_image', async () => {
    await expect(pdfToImage(Buffer.from('not a pdf'))).rejects.toThrow(
      /invalid_image/,
    );
  });
});
