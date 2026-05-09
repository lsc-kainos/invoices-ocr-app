import { Injectable } from '@nestjs/common';
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { LlmCompleteParams, LlmProvider } from './llm-provider.interface';

@Injectable()
export class MockLlmProvider implements LlmProvider {
  async complete(params: LlmCompleteParams): Promise<ChatCompletion> {
    const lastMsg = params.messages[params.messages.length - 1];
    const text = typeof lastMsg.content === 'string' ? lastMsg.content : '';

    if (lastMsg.role === 'tool') {
      return mockCompletion({
        content: 'Encontrei essa informação no documento.',
      });
    }

    if (params.tools.length > 0 && /texto completo|valor total/i.test(text)) {
      const docId = extractDocId(params.messages) ?? 'mock-doc-id';
      return mockCompletion({
        toolCall: {
          id: 'call_mock_1',
          name: 'get_full_document',
          args: { documentId: docId },
        },
      });
    }

    return mockCompletion({ content: 'Resposta mock.' });
  }
}

function extractDocId(messages: ChatCompletionMessageParam[]): string | null {
  for (const m of messages) {
    if (m.role !== 'system' || typeof m.content !== 'string') continue;
    const match = m.content.match(/<document id="([^"]+)"/);
    if (match) return match[1];
  }
  return null;
}

function mockCompletion(opts: {
  content?: string;
  toolCall?: { id: string; name: string; args: object };
}): ChatCompletion {
  return {
    id: 'mock-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'mock',
    choices: [
      {
        index: 0,
        finish_reason: opts.toolCall ? 'tool_calls' : 'stop',
        logprobs: null,
        message: opts.toolCall
          ? {
              role: 'assistant',
              content: '',
              tool_calls: [
                {
                  id: opts.toolCall.id,
                  type: 'function',
                  function: {
                    name: opts.toolCall.name,
                    arguments: JSON.stringify(opts.toolCall.args),
                  },
                },
              ],
              refusal: null,
            }
          : {
              role: 'assistant',
              content: opts.content ?? '',
              refusal: null,
            },
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}
