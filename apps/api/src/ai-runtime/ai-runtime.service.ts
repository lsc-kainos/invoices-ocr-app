import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { generateObject, type CoreMessage } from 'ai';
import { z } from 'zod';
import { LlmConfigKey } from '@prisma/client';
import { LlmConfigService } from './llm-config.service';
import { modelFor } from './providers/provider-registry';

type GenerateOpts<T extends z.ZodTypeAny> = {
  key: LlmConfigKey;
  schema: T;
  messages: CoreMessage[];
  overrides?: {
    model?: string;
    prompt?: string;
    params?: Record<string, unknown>;
  };
};

@Injectable()
export class AiRuntimeService {
  constructor(private readonly llmConfig: LlmConfigService) {}

  async generateObject<T extends z.ZodTypeAny>(
    opts: GenerateOpts<T>,
  ): Promise<z.infer<T>> {
    const config = await this.llmConfig.findActive(opts.key);
    if (!config) {
      throw new InternalServerErrorException(
        `No active LlmConfig for key=${opts.key}`,
      );
    }

    const modelId = opts.overrides?.model ?? config.model;
    const prompt = opts.overrides?.prompt ?? config.prompt;
    const params = {
      ...(config.params as Record<string, unknown>),
      ...(opts.overrides?.params ?? {}),
    };

    const messages: CoreMessage[] = [
      { role: 'system', content: prompt },
      ...opts.messages.filter((m) => m.role !== 'system'),
    ];

    const result = await generateObject({
      model: modelFor(modelId),
      schema: opts.schema,
      messages,
      ...params,
    } as any);

    return result.object as z.infer<T>;
  }
}
