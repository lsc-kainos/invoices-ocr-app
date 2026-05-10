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
    client?: OpenAI,
  ) {
    this.client = client ?? new OpenAI({ apiKey });
  }

  // stream: false hardcoded — streaming path implemented in Task 13 (CHAT_STREAMING env var).
  // Passing stream: true via params is currently a no-op and will return ChatCompletion, not AsyncIterable.
  async complete(params: LlmCompleteParams): Promise<ChatCompletion> {
    return this.client.chat.completions.create({
      model: params.model ?? this.defaultModel,
      messages: params.messages,
      tools: params.tools.length > 0 ? params.tools : undefined,
      tool_choice: params.tools.length > 0 ? 'auto' : undefined,
      stream: false,
    });
  }
}
