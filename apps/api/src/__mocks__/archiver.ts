import { PassThrough } from 'node:stream';

/**
 * Lightweight mock for archiver v8 used in unit tests.
 * Returns a real PassThrough stream so tests can consume it
 * and verify ZIP-like content (we inject the magic bytes manually).
 */
function createMockArchive() {
  const stream = new PassThrough();
  const entries: Array<{ name: string }> = [];

  const archive = Object.assign(stream, {
    _pointer: 0,

    append(source: Buffer | string, opts: { name: string }) {
      entries.push({ name: opts.name });
      // Write a minimal fake ZIP-like chunk with the filename embedded
      const nameBuf = Buffer.from(opts.name, 'latin1');
      const content = Buffer.isBuffer(source)
        ? source
        : Buffer.from(source as string, 'utf8');
      // Emit a chunk that contains the filename (so the test can find it in zipText)
      stream.push(nameBuf);
      stream.push(content);
      archive._pointer += nameBuf.length + content.length;
    },

    finalize() {
      // Prepend PK magic bytes so the ZIP sanity check passes
      // We already pushed chunks, so emit the magic at start via a leading chunk.
      // Instead: push magic + central directory stub at finalize.
      const magic = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
      // Build a fake central directory that includes all entry names
      const centralDir = entries.map((e) => e.name).join('\0');
      stream.push(magic);
      stream.push(Buffer.from(centralDir, 'latin1'));
      stream.end();
    },

    pointer() {
      return archive._pointer;
    },

    on(event: string, handler: (...args: any[]) => void) {
      // Delegate to PassThrough for data/end/error; ignore others gracefully
      (stream as any).on(event, handler);
      return archive;
    },
  });

  return archive;
}

// Mock for archiver v8 named export ZipArchive
class ZipArchive extends PassThrough {
  private entries: Array<{ name: string }> = [];
  private _ptr = 0;

  constructor(_opts?: any) {
    super();
    // Emit PK magic bytes immediately so [0] and [1] checks pass
    this.push(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }

  append(source: Buffer | string, opts: { name: string }) {
    this.entries.push({ name: opts.name });
    const nameBuf = Buffer.from(opts.name, 'latin1');
    const content = Buffer.isBuffer(source)
      ? source
      : Buffer.from(source as string, 'utf8');
    this.push(nameBuf);
    this.push(content);
    this._ptr += nameBuf.length + content.length;
  }

  finalize() {
    // Emit central directory with entry names
    const centralDir = this.entries.map((e) => e.name).join('\0');
    this.push(Buffer.from(centralDir, 'latin1'));
    this.end();
  }

  pointer() {
    return this._ptr;
  }
}

// Default factory function (archiver v7 compat shape used by the service)
function archiverFactory(_format: string, _opts?: any) {
  return new ZipArchive(_opts);
}

archiverFactory.ZipArchive = ZipArchive;

export default archiverFactory;
export { ZipArchive };
