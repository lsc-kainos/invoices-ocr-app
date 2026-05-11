import { BadRequestException } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export function modelFor(modelId: string): LanguageModel {
  if (modelId.startsWith('gpt-')) return openai(modelId);
  throw new BadRequestException(`Unknown model id: ${modelId}`);
}
