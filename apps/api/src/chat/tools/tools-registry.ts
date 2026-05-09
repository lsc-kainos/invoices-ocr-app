import { Injectable } from '@nestjs/common';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { GetFullDocumentTool } from './get-full-document.tool';

export type ToolHandler = (
  args: unknown,
  ctx: { userId: string },
) => Promise<unknown>;

@Injectable()
export class ToolsRegistry {
  constructor(private readonly getFullDocument: GetFullDocumentTool) {}

  getOpenAiSchemas(): ChatCompletionTool[] {
    return [GetFullDocumentTool.schema];
  }

  getHandler(name: string): ToolHandler | null {
    if (name === GetFullDocumentTool.name) {
      return (args, ctx) => this.getFullDocument.execute(args, ctx);
    }
    return null;
  }
}
