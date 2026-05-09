import { buildExtractedTextFile } from './extracted-text-file';

describe('buildExtractedTextFile', () => {
  it('inclui BOM UTF-8 nos 3 primeiros bytes', () => {
    const buf = buildExtractedTextFile('hello');
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    expect(buf.toString('utf8')).toBe('﻿hello');
  });

  it('null vira só BOM', () => {
    expect(buildExtractedTextFile(null).length).toBe(3);
  });
});
