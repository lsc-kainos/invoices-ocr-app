import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';

jest.mock('./providers/available-models', () => ({
  availableModels: () => [
    {
      id: 'gpt-4o',
      provider: 'openai',
      requires: 'OPENAI_API_KEY',
      vision: true,
    },
    {
      id: 'gpt-4o-mini',
      provider: 'openai',
      requires: 'OPENAI_API_KEY',
      vision: true,
    },
  ],
}));

import { LlmConfigController } from './llm-config.controller';
import { LlmConfigService } from './llm-config.service';
import { LlmConfigKey } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AiRuntimeService } from './ai-runtime.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

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
  creator: { email: 'system@invoices-ocr.local' },
  createdAt: new Date(),
};

describe('LlmConfigController', () => {
  let controller: LlmConfigController;
  let service: jest.Mocked<LlmConfigService>;

  beforeEach(async () => {
    service = {
      listAll: jest.fn(),
      findActive: jest.fn(),
      createVersion: jest.fn(),
      activate: jest.fn(),
      reloadCache: jest.fn(),
    } as any;
    const module = await Test.createTestingModule({
      controllers: [LlmConfigController],
      providers: [
        { provide: LlmConfigService, useValue: service },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AiRuntimeService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: (_ctx: ExecutionContext) => true })
      .compile();
    controller = module.get(LlmConfigController);
  });

  it('list retorna todas as versões', async () => {
    service.listAll.mockResolvedValue([baseConfig as any]);
    const result = await controller.list();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cfg1');
  });

  it('create chama createVersion com userId do request', async () => {
    service.createVersion.mockResolvedValue(baseConfig as any);
    await controller.create(
      {
        key: LlmConfigKey.EXTRACTOR,
        model: 'gpt-4o',
        prompt: 'p',
        params: { temperature: 0 },
      },
      { user: { id: 'user1' } } as any,
    );
    expect(service.createVersion).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({ key: LlmConfigKey.EXTRACTOR }),
    );
  });

  it('activate chama service', async () => {
    service.activate.mockResolvedValue(baseConfig as any);
    await controller.activate('cfg1');
    expect(service.activate).toHaveBeenCalledWith('cfg1');
  });

  it('reloadCache retorna { invalidated }', async () => {
    service.reloadCache.mockReturnValue(2);
    const r = await controller.reload();
    expect(r).toEqual({ invalidated: 2 });
  });
});
