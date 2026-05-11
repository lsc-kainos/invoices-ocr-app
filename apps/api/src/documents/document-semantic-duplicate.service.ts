import { Injectable } from '@nestjs/common';
import type { InvoiceSummaryResult } from '../ocr/schemas/invoice-summary.schema';

export type SemanticDuplicateReason = 'nfe_access_key';

export interface SemanticDuplicateSignature {
  semanticHash: string;
  reason: SemanticDuplicateReason;
}

const ACCESS_KEY_CONTEXT = /chave|access\s*key|nf-?e/i;

@Injectable()
export class DocumentSemanticDuplicateService {
  computeSignature(
    parsed: InvoiceSummaryResult,
  ): SemanticDuplicateSignature | null {
    const accessKey = this.findNfeAccessKey(parsed);
    if (!accessKey) return null;

    return {
      semanticHash: `NFKEY:${accessKey}`,
      reason: 'nfe_access_key',
    };
  }

  private findNfeAccessKey(parsed: InvoiceSummaryResult): string | null {
    const fromCore = normalizeAccessKey(parsed.summary.core.accessKey);
    if (fromCore) return fromCore;

    const labelled = parsed.summary.extras.find((extra) =>
      ACCESS_KEY_CONTEXT.test(extra.label),
    );
    const fromLabel = labelled ? normalizeAccessKey(labelled.value) : null;
    if (fromLabel) return fromLabel;

    const allText = [
      parsed.extractedText,
      parsed.summary.narrative,
      ...parsed.summary.extras.flatMap((extra) => [extra.label, extra.value]),
    ].join('\n');
    const contextual = allText.match(
      /(?:chave|access\s*key|nf-?e)[^\d]{0,80}(\d(?:[ \t.-]*\d){43})/i,
    );
    return normalizeAccessKey(contextual?.[1] ?? null);
  }
}

function normalizeAccessKey(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length === 44 ? digits : null;
}
