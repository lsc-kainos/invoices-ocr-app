// pdf-to-img é um pacote ESM-only. Para que o `dynamic import()` funcione tanto
// no runtime CJS do Nest quanto sob ts-jest (que reescreve `import()` para
// `require`), usamos `new Function` para obter um import dinâmico bruto que o
// transpilador não reescreve.
const dynamicImport: <T = unknown>(spec: string) => Promise<T> = new Function(
  'spec',
  'return import(spec)',
) as never;

interface PdfModule {
  pdf: (
    data: Uint8Array,
    opts?: { scale?: number },
  ) => Promise<AsyncIterable<Buffer>>;
}

let pdfFnCache: PdfModule['pdf'] | null = null;

async function loadPdf(): Promise<PdfModule['pdf']> {
  if (pdfFnCache) return pdfFnCache;
  const mod = await dynamicImport<PdfModule>('pdf-to-img');
  pdfFnCache = mod.pdf;
  return pdfFnCache;
}

export async function pdfToImage(buffer: Buffer): Promise<Buffer> {
  try {
    const pdfFn = await loadPdf();
    const doc = await pdfFn(new Uint8Array(buffer), { scale: 2 });
    for await (const page of doc) {
      return page;
    }
    throw new Error('invalid_image: PDF sem páginas renderizáveis');
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('invalid_image')) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'pdf parse failed';
    throw new Error(`invalid_image: ${msg}`);
  }
}
