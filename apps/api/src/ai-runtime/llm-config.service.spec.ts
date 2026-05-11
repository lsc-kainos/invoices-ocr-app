import { LlmConfigService } from './llm-config.service';
import { LlmConfigKey } from '@prisma/client';

function makePrismaMock() {
  const findFirst = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const updateMany = jest.fn();
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const $transaction = jest.fn(async (cb: (tx: any) => Promise<any>) =>
    cb({
      llmConfig: {
        findFirst,
        create,
        update,
        updateMany,
        findMany,
        findUnique,
      },
    }),
  );
  return {
    llmConfig: { findFirst, create, update, updateMany, findMany, findUnique },
    $transaction,
  } as any;
}

const baseConfig = {
  id: 'cfg1',
  key: LlmConfigKey.EXTRACTOR,
  version: 1,
  model: 'gpt-4o',
  prompt: 'p',
  params: { temperature: 0 },
  active: true,
  notes: null,
  createdBy: 'u1',
  createdAt: new Date(),
};

describe('LlmConfigService', () => {
  describe('findActive', () => {
    it('cacheia resultado por 60s', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findFirst.mockResolvedValue(baseConfig);
      const svc = new LlmConfigService(prisma);

      const a = await svc.findActive(LlmConfigKey.EXTRACTOR);
      const b = await svc.findActive(LlmConfigKey.EXTRACTOR);

      expect(a).toEqual(baseConfig);
      expect(b).toEqual(baseConfig);
      expect(prisma.llmConfig.findFirst).toHaveBeenCalledTimes(1);
    });

    it('reload invalida o cache', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findFirst.mockResolvedValue(baseConfig);
      const svc = new LlmConfigService(prisma);

      await svc.findActive(LlmConfigKey.EXTRACTOR);
      svc.reloadCache();
      await svc.findActive(LlmConfigKey.EXTRACTOR);

      expect(prisma.llmConfig.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('createVersion', () => {
    it('cria versão MAX+1 inativa', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findFirst.mockResolvedValueOnce({
        ...baseConfig,
        version: 3,
      });
      prisma.llmConfig.create.mockResolvedValue({
        ...baseConfig,
        id: 'cfg2',
        version: 4,
        active: false,
      });
      const svc = new LlmConfigService(prisma);

      const result = await svc.createVersion('user1', {
        key: LlmConfigKey.EXTRACTOR,
        model: 'gpt-4o',
        prompt: 'novo prompt',
        params: { temperature: 0.2 },
      });

      expect(result.version).toBe(4);
      expect(result.active).toBe(false);
      expect(prisma.llmConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 4,
          active: false,
          createdBy: 'user1',
        }),
      });
    });

    it('versão 1 quando não há nenhuma', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findFirst.mockResolvedValueOnce(null);
      prisma.llmConfig.create.mockResolvedValue({
        ...baseConfig,
        version: 1,
        active: false,
      });
      const svc = new LlmConfigService(prisma);

      const result = await svc.createVersion('user1', {
        key: LlmConfigKey.CHAT,
        model: 'gpt-4o',
        prompt: 'p',
        params: {},
      });

      expect(prisma.llmConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ version: 1 }),
      });
    });
  });

  describe('activate', () => {
    it('desativa anterior e ativa nova em transação', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findUnique.mockResolvedValue({
        ...baseConfig,
        id: 'cfg2',
        active: false,
      });
      prisma.llmConfig.update.mockResolvedValue({
        ...baseConfig,
        id: 'cfg2',
        active: true,
      });
      prisma.llmConfig.updateMany.mockResolvedValue({ count: 1 });
      const svc = new LlmConfigService(prisma);

      await svc.activate('cfg2');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.llmConfig.updateMany).toHaveBeenCalledWith({
        where: { key: LlmConfigKey.EXTRACTOR, active: true },
        data: { active: false },
      });
      expect(prisma.llmConfig.update).toHaveBeenCalledWith({
        where: { id: 'cfg2' },
        data: { active: true },
      });
    });

    it('invalida cache após ativar', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findFirst.mockResolvedValue(baseConfig);
      prisma.llmConfig.findUnique.mockResolvedValue({
        ...baseConfig,
        id: 'cfg2',
        active: false,
      });
      prisma.llmConfig.update.mockResolvedValue({});
      prisma.llmConfig.updateMany.mockResolvedValue({ count: 1 });
      const svc = new LlmConfigService(prisma);

      await svc.findActive(LlmConfigKey.EXTRACTOR);
      await svc.activate('cfg2');
      await svc.findActive(LlmConfigKey.EXTRACTOR);

      expect(prisma.llmConfig.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('listAll', () => {
    it('inclui creator para resolver email', async () => {
      const prisma = makePrismaMock();
      prisma.llmConfig.findMany.mockResolvedValue([
        { ...baseConfig, creator: { email: 'a@b.com' } },
      ]);
      const svc = new LlmConfigService(prisma);

      const result = await svc.listAll();

      expect(prisma.llmConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { creator: { select: { email: true } } },
        }),
      );
      expect(result[0]).toMatchObject({ creator: { email: 'a@b.com' } });
    });
  });
});
