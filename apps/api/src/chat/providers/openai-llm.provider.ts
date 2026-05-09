import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import type { LlmCompleteParams, LlmProvider } from './llm-provider.interface';

@Injectable()
export class OpenaiLlmProvider implements LlmProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly defaultModel: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(params: LlmCompleteParams): Promise<ChatCompletion> {
    return this.client.chat.completions.create({
      model: params.model,
      messages: params.messages,
      tools: params.tools.length > 0 ? params.tools : undefined,
      tool_choice: params.tools.length > 0 ? 'auto' : undefined,
      stream: false,
    }) as Promise<ChatCompletion>;
  }
}
