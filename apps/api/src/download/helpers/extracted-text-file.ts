const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

export function buildExtractedTextFile(text: string | null): Buffer {
  const body = Buffer.from(text ?? '', 'utf8');
  return Buffer.concat([BOM, body]);
}
