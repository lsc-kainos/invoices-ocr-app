import { BenchmarkPersistenceService } from './benchmark-persistence.service';

const makeInput = (
  over: Partial<Parameters<BenchmarkPersistenceService['persist']>[0]> = {},
) => ({
  runBy: 'user1',
  llmConfigId: 'cfg1',
  modelSnapshot: 'gpt-4o',
  promptSnapshot: 'You are an extractor...',
  paramsSnapshot: { temperature: 0 },
  datasetVersion: 'v1',
  sampleCount: 5,
  aggregate: {
    avgScore: 0.8,
    passedCount: 4,
    failedCount: 1,
    perField: {},
    errorCounts: { refusal: 0, parse_error: 0, io_error: 0, unknown: 0 },
  },
  results: [{ filename: 'a.jpg', score: 1 }],
  durationMs: 1234,
  ...over,
});

describe('BenchmarkPersistenceService', () => {
  it('insere row com snapshot completo', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'run1' });
    const prisma = { benchmarkRun: { create } } as never;
    const svc = new BenchmarkPersistenceService(prisma);

    const result = await svc.persist(makeInput());

    expect(result.id).toBe('run1');
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runBy: 'user1',
        llmConfigId: 'cfg1',
        modelSnapshot: 'gpt-4o',
        sampleCount: 5,
        durationMs: 1234,
      }),
      select: { id: true },
    });
  });

  it('aceita llmConfigId null', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'run2' });
    const prisma = { benchmarkRun: { create } } as never;
    const svc = new BenchmarkPersistenceService(prisma);

    await svc.persist(makeInput({ llmConfigId: null }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ llmConfigId: null }),
      }),
    );
  });
});
