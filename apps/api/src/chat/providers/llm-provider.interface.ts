import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletion,
  ChatCompletionChunk,
} from 'openai/resources/chat/completions';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmCompleteParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  tools: ChatCompletionTool[];
  stream?: boolean;
}

export interface LlmProvider {
  complete(
    params: LlmCompleteParams,
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>>;
}
