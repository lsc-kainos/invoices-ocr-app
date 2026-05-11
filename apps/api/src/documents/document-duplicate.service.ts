import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { InvoiceSummaryResult } from '../ocr/schemas/invoice-summary.schema';

export type DuplicateSignatureReason =
  | 'nf_access_key'
  | 'full_invoice_identity'
  | 'minimal_parties_total';

export interface DuplicateSignature {
  semanticHash: string;
  reason: DuplicateSignatureReason;
  minConfidence: number;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;
const MINIMAL_FALLBACK_CONFIDENCE_THRESHOLD = 0.85;

@Injectable()
export class DocumentDuplicateService {
  computeSignature(parsed: InvoiceSummaryResult): DuplicateSignature | null {
    const accessKey = this.findAccessKey(parsed);
    if (accessKey) {
      return {
        semanticHash: `NFKEY:${accessKey}`,
        reason: 'nf_access_key',
        minConfidence: DEFAULT_CONFIDENCE_THRESHOLD,
      };
    }

    const sellerTaxId = this.findSellerTaxId(parsed);
    const clientTaxId = this.findClientTaxId(parsed);
    const totalAmountCents = this.parseAmountCents(parsed.summary.core.total);

    if (!sellerTaxId || !clientTaxId || totalAmountCents == null) {
      return null;
    }

    const invoiceNumber = normalizeText(parsed.summary.core.invoiceNumber);
    const invoiceDate = normalizeDate(parsed.summary.core.invoiceDate);

    if (invoiceNumber && invoiceDate) {
      return {
        semanticHash: stableSignature('INVOICE', [
          sellerTaxId,
          clientTaxId,
          String(totalAmountCents),
          invoiceNumber,
          invoiceDate,
        ]),
        reason: 'full_invoice_identity',
        minConfidence: DEFAULT_CONFIDENCE_THRESHOLD,
      };
    }

    return {
      semanticHash: stableSignature('PARTIES_TOTAL', [
        sellerTaxId,
        clientTaxId,
        String(totalAmountCents),
      ]),
      reason: 'minimal_parties_total',
      minConfidence: MINIMAL_FALLBACK_CONFIDENCE_THRESHOLD,
    };
  }

  private findAccessKey(parsed: InvoiceSummaryResult): string | null {
    const labelled = parsed.summary.extras.find((extra) =>
      /chave|access\s*key|nf-?e/i.test(extra.label),
    );
    const fromLabel = labelled ? digitsOnly(labelled.value) : null;
    if (fromLabel?.length === 44) return fromLabel;

    const allText = [
      parsed.extractedText,
      parsed.summary.narrative,
      ...parsed.summary.extras.flatMap((extra) => [extra.label, extra.value]),
    ].join('\n');
    const contextual = allText.match(
      /(?:chave|access\s*key|nf-?e)[^\d]{0,80}(\d(?:[ \t.-]*\d){43})/i,
    );
    return contextual?.[1]?.replace(/\D/g, '') ?? null;
  }

  private findSellerTaxId(parsed: InvoiceSummaryResult): string | null {
    return this.findTaxIdByLabel(
      parsed,
      /emitente|prestador|fornecedor|vendedor|seller/i,
      0,
    );
  }

  private findClientTaxId(parsed: InvoiceSummaryResult): string | null {
    return this.findTaxIdByLabel(
      parsed,
      /destinat[aá]rio|tomador|cliente|comprador|client|customer/i,
      1,
    );
  }

  private findTaxIdByLabel(
    parsed: InvoiceSummaryResult,
    labelPattern: RegExp,
    fallbackIndex: number,
  ): string | null {
    const labelled = parsed.summary.extras.find((extra) =>
      labelPattern.test(extra.label),
    );
    const taxId = labelled ? normalizeTaxId(labelled.value) : null;
    if (taxId) return taxId;

    const taxIds = parsed.summary.extras
      .map((extra) => normalizeTaxId(extra.value))
      .filter((value): value is string => Boolean(value));
    return taxIds[fallbackIndex] ?? null;
  }

  private parseAmountCents(value: string | null): number | null {
    if (!value) return null;
    const cleaned = value.replace(/[^\d,.\-]/g, '');
    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    const lastSeparator = Math.max(lastComma, lastDot);
    const fractionalDigits =
      lastSeparator >= 0 ? cleaned.length - lastSeparator - 1 : 0;
    const hasSingleSeparator =
      (lastComma >= 0 ? 1 : 0) + (lastDot >= 0 ? 1 : 0) === 1;
    const decimalSeparator =
      hasSingleSeparator && fractionalDigits === 3
        ? null
        : lastComma > lastDot
          ? ','
          : '.';
    const normalized = decimalSeparator
      ? cleaned
          .replace(
            new RegExp(`\\${decimalSeparator === ',' ? '.' : ','}`, 'g'),
            '',
          )
          .replace(decimalSeparator, '.')
      : cleaned.replace(/[^\d\-]/g, '');
    const amount = Number(normalized);
    if (!Number.isFinite(amount)) return null;
    return Math.round(amount * 100);
  }
}

function stableSignature(prefix: string, parts: string[]): string {
  const digest = createHash('sha256').update(parts.join('|')).digest('hex');
  return `${prefix}:${digest}`;
}

function normalizeText(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return normalizeText(trimmed);
}

function normalizeTaxId(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length === 11 || digits.length === 14) return digits;
  return null;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
