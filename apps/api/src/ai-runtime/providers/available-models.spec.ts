import { availableModels, MODEL_CATALOG } from './available-models';

describe('availableModels', () => {
  it('inclui modelos openai quando OPENAI_API_KEY presente', () => {
    const result = availableModels({ OPENAI_API_KEY: 'sk-test' });
    const ids = result.map((m) => m.id);
    expect(ids).toContain('gpt-4o');
    expect(ids).toContain('gpt-4o-mini');
  });

  it('exclui openai quando OPENAI_API_KEY ausente', () => {
    const result = availableModels({});
    const openaiModels = result.filter((m) => m.provider === 'openai');
    expect(openaiModels).toHaveLength(0);
  });

  it('catalog imutável', () => {
    expect(Object.isFrozen(MODEL_CATALOG)).toBe(true);
  });
});
