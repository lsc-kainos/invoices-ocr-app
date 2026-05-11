import { BadRequestException } from '@nestjs/common';
import { modelFor } from './provider-registry';

describe('provider-registry.modelFor', () => {
  it('resolve gpt-4o como provider openai', () => {
    const m = modelFor('gpt-4o');
    expect(m).toBeDefined();
  });

  it('lança BadRequestException para id desconhecido', () => {
    expect(() => modelFor('unknown-model-x')).toThrow(BadRequestException);
  });
});
