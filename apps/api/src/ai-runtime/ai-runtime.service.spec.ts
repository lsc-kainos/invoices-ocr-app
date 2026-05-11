import { z } from 'zod';
import { LlmConfigKey } from '@prisma/client';
import { AiRuntimeService } from './ai-runtime.service';

const generateObjectMock = jest.fn();
jest.mock('ai', () => ({
  generateObject: (...args: any[]) => generateObjectMock(...args),
}));

jest.mock('./providers/provider-registry', () => ({
  modelFor: (id: string) => ({ id, _isMock: true }),
}));

const baseConfig = {
  id: 'cfg1',
  key: LlmConfigKey.EXTRACTOR,
  version: 1,
  model: 'gpt-4o',
  prompt: 'system prompt aqui',
  params: { temperature: 0 },
  active: true,
  notes: null,
  createdBy: 'u1',
  createdAt: new Date(),
};

describe('AiRuntimeService', () => {
  beforeEach(() => generateObjectMock.mockReset());

  it('chama generateObject com config ativa e retorna object validado', async () => {
    const llmConfig = { findActive: jest.fn().mockResolvedValue(baseConfig) };
    const schema = z.object({ x: z.number() });
    generateObjectMock.mockResolvedValue({ object: { x: 42 } });

    const svc = new AiRuntimeService(llmConfig as any);
    const result = await svc.generateObject({
      key: LlmConfigKey.EXTRACTOR,
      schema,
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result).toEqual({ x: 42 });
    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { id: 'gpt-4o', _isMock: true },
        schema,
        temperature: 0,
        messages: [
          { role: 'system', content: 'system prompt aqui' },
          { role: 'user', content: 'hi' },
        ],
      }),
    );
  });

  it('overrides substituem model e prompt da config', async () => {
    const llmConfig = { findActive: jest.fn().mockResolvedValue(baseConfig) };
    const schema = z.object({});
    generateObjectMock.mockResolvedValue({ object: {} });

    const svc = new AiRuntimeService(llmConfig as any);
    await svc.generateObject({
      key: LlmConfigKey.EXTRACTOR,
      schema,
      messages: [],
      overrides: {
        model: 'gpt-4o-mini',
        prompt: 'custom',
        params: { temperature: 0.7 },
      },
    });

    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { id: 'gpt-4o-mini', _isMock: true },
        temperature: 0.7,
        messages: [{ role: 'system', content: 'custom' }],
      }),
    );
  });

  it('lança erro quando não há config ativa', async () => {
    const llmConfig = { findActive: jest.fn().mockResolvedValue(null) };
    const svc = new AiRuntimeService(llmConfig as any);
    await expect(
      svc.generateObject({
        key: LlmConfigKey.EXTRACTOR,
        schema: z.object({}),
        messages: [],
      }),
    ).rejects.toThrow(/no active LlmConfig/i);
  });
});
