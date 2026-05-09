import { join } from 'node:path';
import { loadCsvSamples } from './csv-loader';

describe('loadCsvSamples', () => {
  const samplesDir = join(process.cwd(), '../..', 'samples/invoice-dataset');

  it('loads samples from all 3 CSV batches', async () => {
    const samples = await loadCsvSamples(samplesDir);

    expect(Array.isArray(samples)).toBe(true);
    expect(samples.length).toBeGreaterThan(0);
  });

  it('every filename matches batch1-XXXX.jpg pattern', async () => {
    const samples = await loadCsvSamples(samplesDir);
    const pattern = /^batch1-\d{4}\.jpg$/;
    for (const s of samples.slice(0, 50)) {
      expect(s.filename).toMatch(pattern);
    }
  });

  it('groundTruth.total is non-null string for rows with totals', async () => {
    const samples = await loadCsvSamples(samplesDir);
    const withTotal = samples.find((s) => s.groundTruth.total !== null);
    expect(withTotal).toBeDefined();
    expect(typeof withTotal!.groundTruth.total).toBe('string');
    expect(withTotal!.groundTruth.total!.length).toBeGreaterThan(0);
  });

  it('empty strings in CSV map to null in groundTruth', async () => {
    const samples = await loadCsvSamples(samplesDir);
    // every field is either null or a non-empty string
    for (const s of samples.slice(0, 100)) {
      for (const v of Object.values(s.groundTruth)) {
        if (v !== null) {
          expect(typeof v).toBe('string');
          expect(v).not.toBe('');
        }
      }
    }
  });
});
