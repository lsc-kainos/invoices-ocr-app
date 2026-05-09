import { promises as fs } from 'node:fs';
import { BenchmarkService, type BenchmarkEvent } from './benchmark.service';
import { loadCsvSamples, type BenchmarkSample } from './csv-loader';
import type { OpenAiOcrProvider } from '../providers/openai-ocr.provider';
import type { InvoiceSummaryResult } from '../schemas/invoice-summary.schema';

jest.mock('./csv-loader');
jest.mock('node:fs', () => ({
  promises: { readFile: jest.fn() },
}));

const mockedLoad = loadCsvSamples as jest.MockedFunction<typeof loadCsvSamples>;
const mockedReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

function makeFixture(): InvoiceSummaryResult {
  return {
    summary: {
      core: {
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        sellerName: null,
        sellerAddress: null,
        clientName: null,
        clientAddress: null,
        tax: null,
        discount: null,
        total: null,
        paymentMethod: null,
      },
      items: [],
      extras: [],
      narrative: 'test',
    },
    extractedText: 'test text',
  };
}

function makeSample(filename: string): BenchmarkSample {
  return {
    filename,
    groundTruth: {
      invoiceNumber: null,
      invoiceDate: null,
      dueDate: null,
      sellerName: null,
      clientName: null,
      tax: null,
      total: null,
    },
    items: [],
    ocrText: '',
  };
}

describe('BenchmarkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadFile.mockResolvedValue(Buffer.from('fake-image'));
  });

  it('emits 2 progress events + 1 complete for 2 samples', async () => {
    mockedLoad.mockResolvedValue([makeSample('a.jpg'), makeSample('b.jpg')]);
    const extract = jest.fn().mockResolvedValue(makeFixture());
    const provider = { extract } as unknown as OpenAiOcrProvider;

    const service = new BenchmarkService(provider);
    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake')) events.push(ev);

    const progress = events.filter((e) => e.type === 'progress');
    const complete = events.filter((e) => e.type === 'complete');
    expect(progress).toHaveLength(2);
    expect(complete).toHaveLength(1);
    expect(progress[0].type === 'progress' && progress[0].score).toBeDefined();
    expect(extract).toHaveBeenCalledTimes(2);
  });

  it('continues after extract error and reports error in event', async () => {
    mockedLoad.mockResolvedValue([makeSample('a.jpg'), makeSample('b.jpg')]);
    const extract = jest
      .fn()
      .mockRejectedValueOnce(new Error('refusal: blocked'))
      .mockResolvedValueOnce(makeFixture());
    const provider = { extract } as unknown as OpenAiOcrProvider;

    const service = new BenchmarkService(provider);
    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake')) events.push(ev);

    expect(events).toHaveLength(3);
    const first = events[0];
    const second = events[1];
    expect(first.type).toBe('progress');
    expect(second.type).toBe('progress');
    if (first.type === 'progress') expect(first.error).toBe('refusal');
    if (second.type === 'progress') {
      expect(second.error).toBeUndefined();
      expect(second.score).toBeDefined();
    }
    expect(extract).toHaveBeenCalledTimes(2);
  });
});
