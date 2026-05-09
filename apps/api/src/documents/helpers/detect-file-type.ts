// file-type é ESM-only. Wrapper que usa dynamic import "real" (não reescrito
// pelo ts-jest) para funcionar tanto em runtime CJS quanto em testes Jest.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport: <T = unknown>(spec: string) => Promise<T> = new Function(
  'spec',
  'return import(spec)',
) as never;

interface FileTypeModule {
  fileTypeFromBuffer: (
    buf: Uint8Array,
  ) => Promise<{ ext: string; mime: string } | undefined>;
}

let cache: FileTypeModule['fileTypeFromBuffer'] | null = null;

async function loadFn(): Promise<FileTypeModule['fileTypeFromBuffer']> {
  if (cache) return cache;
  const mod = await dynamicImport<FileTypeModule>('file-type');
  cache = mod.fileTypeFromBuffer;
  return cache;
}

export async function detectFileType(
  buffer: Buffer,
): Promise<{ ext: string; mime: string } | undefined> {
  const fn = await loadFn();
  return fn(new Uint8Array(buffer));
}
