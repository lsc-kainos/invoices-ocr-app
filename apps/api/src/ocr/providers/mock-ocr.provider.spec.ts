import { MockOcrProvider } from './mock-ocr.provider';
import { invoiceSummarySchema } from '../schemas/invoice-summary.schema';

describe('MockOcrProvider', () => {
  let provider: MockOcrProvider;

  beforeEach(() => {
    provider = new MockOcrProvider();
  });

  it('mesmo buffer → mesmo resultado (determinístico)', async () => {
    const buf = Buffer.from('hello world');
    const a = await provider.extract(buf, 'image/jpeg');
    const b = await provider.extract(buf, 'image/jpeg');
    expect(a).toEqual(b);
  });

  it('buffers diferentes podem cair em fixtures diferentes', async () => {
    const seen = new Set<string>();
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const r = await provider.extract(Buffer.from(seed), 'image/jpeg');
      seen.add(r.summary.core.tipo ?? 'null');
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  }, 15_000);

  it('resposta passa o invoiceSummarySchema', async () => {
    const r = await provider.extract(Buffer.from('xyz'), 'application/pdf');
    expect(() => invoiceSummarySchema.parse(r)).not.toThrow();
  });
});
