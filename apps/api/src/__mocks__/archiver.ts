import { PassThrough } from 'node:stream';

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
      : Buffer.from(source, 'utf8');
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
