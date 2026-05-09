// Este spec carrega `pdf-to-img` real, que depende de `@napi-rs/canvas` e
// pdfjs-dist (workers + lazy imports que vazam para depois do teardown do
// Jest, gerando "import after env torn down" em CI). Por isso o arquivo é
// integralmente skipado por default; rodar com `RUN_PDF_INTEGRATION=1`
// localmente para validar o caminho de PDF real. O caminho ponta-a-ponta
// também é coberto pelo E2E (apps/api/test/documents.e2e-spec.ts) quando
// invoice-en.pdf é enviado.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const runIntegration = process.env.RUN_PDF_INTEGRATION === '1';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('pdfToImage (integration)', () => {
  // Import dentro do describe pra que o módulo só carregue quando o suite roda.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pdfToImage } =
    require('./pdf-to-image') as typeof import('./pdf-to-image');

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
