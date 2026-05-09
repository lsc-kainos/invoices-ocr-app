import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';

const argsSchema = z.object({ documentId: z.string().min(1) });

export type GetFullDocumentResult =
  | { extractedText: string }
  | { error: 'not_found' | 'not_ready' | 'no_text' | 'invalid_arguments' };

@Injectable()
export class GetFullDocumentTool {
  static readonly name = 'get_full_document';
  static readonly schema = {
    type: 'function' as const,
    function: {
      name: 'get_full_document',
      description: 'Returns the full extracted text of a user document.',
      parameters: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'Document ID (cuid)' },
        },
        required: ['documentId'],
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    rawArgs: unknown,
    ctx: { userId: string },
  ): Promise<GetFullDocumentResult> {
    const parsed = argsSchema.safeParse(rawArgs);
    if (!parsed.success) return { error: 'invalid_arguments' };

    const doc = await this.prisma.document.findFirst({
      where: { id: parsed.data.documentId, userId: ctx.userId },
      select: { extractedText: true, status: true },
    });

    if (!doc) return { error: 'not_found' };
    if (doc.status !== 'READY') return { error: 'not_ready' };
    if (!doc.extractedText) return { error: 'no_text' };

    return { extractedText: doc.extractedText };
  }
}
