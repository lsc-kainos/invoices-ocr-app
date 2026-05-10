import { promises as fs } from 'node:fs';
import { BenchmarkService, type BenchmarkEvent } from './benchmark.service';
import { loadCsvSamples, type BenchmarkSample } from './csv-loader';
import type { ExtractorService } from '../extractor.service';
import type { LlmConfigService } from '../../ai-runtime/llm-config.service';
import type { BenchmarkPersistenceService } from './benchmark-persistence.service';
import type { ConfigService } from '@nestjs/config';
import type { InvoiceSummaryResult } from '../schemas/invoice-summary.schema';

jest.mock('./csv-loader');
jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  promises: {
    ...jest.requireActual<typeof import('node:fs')>('node:fs').promises,
    readFile: jest.fn(),
  },
}));

const mockedLoad = loadCsvSamples as jest.MockedFunction<typeof loadCsvSamples>;
const mockedReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

function makeFixture(): InvoiceSummaryResult {
  return {
    documentType: 'unknown',
    confidence: 1,
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

function makeService(extract: jest.Mock, findActiveMock?: jest.Mock) {
  const llmConfig = {
    findActive:
      findActiveMock ??
      jest
        .fn()
        .mockResolvedValue({
          id: 'cfg1',
          model: 'gpt-4o',
          prompt: 'p',
          params: {},
        }),
  } as unknown as LlmConfigService;
  const persistence = {
    persist: jest.fn().mockResolvedValue({ id: 'run1' }),
  } as unknown as BenchmarkPersistenceService;
  const configSvc = {
    get: jest.fn().mockReturnValue('v1'),
  } as unknown as ConfigService;
  const extractor = { extract } as unknown as ExtractorService;
  return {
    service: new BenchmarkService(extractor, llmConfig, persistence, configSvc),
    llmConfig,
    persistence,
    configSvc,
    extractor,
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
    const { service } = makeService(extract);

    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake', 'user-x'))
      events.push(ev);

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
    const { service } = makeService(extract);

    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake', 'user-x'))
      events.push(ev);

    const progressEvents = events.filter((e) => e.type === 'progress');
    expect(progressEvents).toHaveLength(2);
    const first = progressEvents[0];
    const second = progressEvents[1];
    expect(first.type).toBe('progress');
    expect(second.type).toBe('progress');
    if (first.type === 'progress') expect(first.error).toBe('refusal');
    if (second.type === 'progress') {
      expect(second.error).toBeUndefined();
      expect(second.score).toBeDefined();
    }
    expect(extract).toHaveBeenCalledTimes(2);
  });

  it('emits persisted event before complete', async () => {
    mockedLoad.mockResolvedValue([makeSample('a.jpg')]);
    const extract = jest.fn().mockResolvedValue(makeFixture());
    const { service } = makeService(extract);

    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake', 'user-x'))
      events.push(ev);

    const persisted = events.find((e) => e.type === 'persisted');
    const complete = events.find((e) => e.type === 'complete');
    expect(persisted).toBeDefined();
    expect(complete).toBeDefined();
    expect(persisted!.type === 'persisted' && persisted!.runId).toBe('run1');

    const persistedIdx = events.indexOf(persisted!);
    const completeIdx = events.indexOf(complete!);
    expect(persistedIdx).toBeLessThan(completeIdx);
  });

  it('when no active config → emits error and stops', async () => {
    mockedLoad.mockResolvedValue([makeSample('a.jpg')]);
    const extract = jest.fn();
    const findActive = jest.fn().mockResolvedValue(null);
    const { service, persistence } = makeService(extract, findActive);

    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake', 'user-x'))
      events.push(ev);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    if (events[0].type === 'error') {
      expect(events[0].code).toBe('no_active_extractor_config');
    }
    expect(persistence.persist as jest.Mock).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it('persist called with correct snapshot', async () => {
    mockedLoad.mockResolvedValue([makeSample('a.jpg')]);
    const extract = jest.fn().mockResolvedValue(makeFixture());
    const { service, persistence } = makeService(extract);

    const events: BenchmarkEvent[] = [];
    for await (const ev of service.runStream('/fake', 'user-x'))
      events.push(ev);

    expect(persistence.persist as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        runBy: 'user-x',
        llmConfigId: 'cfg1',
        modelSnapshot: 'gpt-4o',
        sampleCount: 1,
        datasetVersion: 'v1',
      }),
    );
  });
});
