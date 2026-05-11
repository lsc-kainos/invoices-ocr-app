import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { InvoiceSummaryResult } from '../ocr/schemas/invoice-summary.schema';

export type SemanticDuplicateReason =
  | 'nfe_access_key'
  | 'document_identity'
  | 'boleto_identifier';

export type DuplicateMatchStrength = 'strong' | 'needs_confirmation';

export interface SemanticDuplicateSignature {
  semanticHash: string;
  reason: SemanticDuplicateReason;
  matchStrength: DuplicateMatchStrength;
}

const ACCESS_KEY_CONTEXT = /chave|access\s*key|nf-?e/i;
const TAX_ID_CONTEXT = /cnpj|cpf|vat|tax\s*id|taxpayer|inscri[cç][aã]o/i;
const ISSUER_CONTEXT =
  /emitente|issuer|seller|fornecedor|prestador|cedente|benefici[aá]rio/i;
const RECIPIENT_CONTEXT =
  /destinat[aá]rio|recipient|client|cliente|tomador|pagador|sacado/i;
const BOLETO_IDENTIFIER_CONTEXT =
  /linha\s*digit[aá]vel|c[oó]digo\s*de\s*barras|barcode|nosso\s*n[uú]mero/i;
const MONTHS_PT_BR: Record<string, string> = {
  janeiro: '01',
  fevereiro: '02',
  marco: '03',
  março: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
};

interface Identity {
  value: string;
  kind: 'tax_id' | 'name';
}

@Injectable()
export class DocumentSemanticDuplicateService {
  computeSignature(
    parsed: InvoiceSummaryResult,
  ): SemanticDuplicateSignature | null {
    const accessKey = this.findNfeAccessKey(parsed);
    if (accessKey) {
      return {
        semanticHash: `NFKEY:${accessKey}`,
        reason: 'nfe_access_key',
        matchStrength: 'strong',
      };
    }

    return this.computeDocumentIdentitySignature(parsed);
  }

  private findNfeAccessKey(parsed: InvoiceSummaryResult): string | null {
    const fromCore = normalizeAccessKey(parsed.summary.core.accessKey);
    if (fromCore) return fromCore;

    for (const extra of parsed.summary.extras) {
      if (!ACCESS_KEY_CONTEXT.test(extra.label)) continue;
      const fromLabel = normalizeAccessKey(extra.value);
      if (fromLabel) return fromLabel;
    }

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

  private computeDocumentIdentitySignature(
    parsed: InvoiceSummaryResult,
  ): SemanticDuplicateSignature | null {
    const issuer = this.findIdentity(parsed, 'issuer');
    const recipient = this.findIdentity(parsed, 'recipient');
    const amountCents = normalizeMoneyToCents(parsed.summary.core.total);
    const documentDate = normalizeDate(
      parsed.summary.core.invoiceDate ??
        (parsed.documentType === 'boleto' ? parsed.summary.core.dueDate : null),
    );

    if (!issuer || !recipient || amountCents === null || !documentDate) {
      return null;
    }

    const invoiceNumber = normalizeTextIdentifier(
      parsed.summary.core.invoiceNumber,
    );
    const boletoIdentifier =
      parsed.documentType === 'boleto'
        ? this.findBoletoIdentifier(parsed)
        : null;
    const parts = [
      `type=${normalizeTextIdentifier(parsed.documentType)}`,
      `issuer=${issuer.value}`,
      `recipient=${recipient.value}`,
      `amount=${amountCents}`,
      `date=${documentDate}`,
      ...(invoiceNumber ? [`number=${invoiceNumber}`] : []),
      ...(boletoIdentifier ? [`boleto=${boletoIdentifier}`] : []),
    ];
    const strong =
      Boolean(invoiceNumber) ||
      (issuer.kind === 'tax_id' && recipient.kind === 'tax_id') ||
      Boolean(boletoIdentifier);

    return {
      semanticHash: `DOCID:v1:${createHash('sha256')
        .update(parts.join('|'))
        .digest('hex')}`,
      reason: boletoIdentifier ? 'boleto_identifier' : 'document_identity',
      matchStrength: strong ? 'strong' : 'needs_confirmation',
    };
  }

  private findIdentity(
    parsed: InvoiceSummaryResult,
    role: 'issuer' | 'recipient',
  ): Identity | null {
    const context = role === 'issuer' ? ISSUER_CONTEXT : RECIPIENT_CONTEXT;
    const taxId = this.findContextualTaxId(parsed, context);
    if (taxId) return { value: `tax:${taxId}`, kind: 'tax_id' };

    const name =
      role === 'issuer'
        ? parsed.summary.core.sellerName
        : parsed.summary.core.clientName;
    const normalizedName = normalizeName(name);
    return normalizedName
      ? { value: `name:${normalizedName}`, kind: 'name' }
      : null;
  }

  private findContextualTaxId(
    parsed: InvoiceSummaryResult,
    context: RegExp,
  ): string | null {
    for (const extra of parsed.summary.extras) {
      const label = extra.label;
      if (!context.test(label) || !TAX_ID_CONTEXT.test(label)) continue;
      const taxId = normalizeTaxId(`${label} ${extra.value}`);
      if (taxId) return taxId;
    }

    const lines = [
      parsed.extractedText,
      parsed.summary.narrative,
      ...parsed.summary.extras.map((extra) => `${extra.label} ${extra.value}`),
    ]
      .join('\n')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    for (let i = 0; i < lines.length; i += 1) {
      const haystack = `${lines[i]} ${lines[i + 1] ?? ''}`;
      if (!context.test(haystack) || !TAX_ID_CONTEXT.test(haystack)) continue;
      const taxId = normalizeTaxId(haystack);
      if (taxId) return taxId;
    }
    return null;
  }

  private findBoletoIdentifier(parsed: InvoiceSummaryResult): string | null {
    for (const extra of parsed.summary.extras) {
      if (!BOLETO_IDENTIFIER_CONTEXT.test(extra.label)) continue;
      const identifier = normalizeBoletoIdentifier(extra.value);
      if (identifier) return identifier;
    }

    const text = [
      parsed.extractedText,
      parsed.summary.narrative,
      ...parsed.summary.extras.flatMap((extra) => [extra.label, extra.value]),
    ].join('\n');
    const contextual = text.match(
      /(?:linha\s*digit[aá]vel|c[oó]digo\s*de\s*barras|barcode|nosso\s*n[uú]mero)[^\dA-Za-z]{0,80}([\d .-]{10,80}|[A-Za-z0-9.-]{5,40})/i,
    );
    return normalizeBoletoIdentifier(contextual?.[1] ?? null);
  }
}

function normalizeAccessKey(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length === 44 ? digits : null;
}

function normalizeTaxId(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length === 11 || digits.length === 14 ? digits : null;
}

function normalizeName(value: string | null | undefined): string | null {
  const normalized = normalizeTextIdentifier(value)
    ?.replace(
      /\b(ltda|eireli|sa|s\/a|me|epp|mei|inc|llc|limited|company|companhia)\b/g,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || null;
}

function normalizeTextIdentifier(
  value: string | null | undefined,
): string | null {
  const normalized = value
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeMoneyToCents(
  value: string | null | undefined,
): number | null {
  const cleaned = value?.replace(/[^\d,.-]/g, '').replace(/\s/g, '') ?? '';
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = cleaned
      .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    normalized = normalizeSingleSeparatorMoney(cleaned, ',');
  } else if (lastDot >= 0) {
    normalized = normalizeSingleSeparatorMoney(cleaned, '.');
  } else {
    normalized = cleaned;
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

function normalizeSingleSeparatorMoney(
  value: string,
  separator: ',' | '.',
): string {
  const last = value.lastIndexOf(separator);
  const fractionLength = value.length - last - 1;
  const isDecimal = fractionLength > 0 && fractionLength <= 2;
  if (!isDecimal) return value.replace(new RegExp(`\\${separator}`, 'g'), '');
  const integer = value
    .slice(0, last)
    .replace(new RegExp(`\\${separator}`, 'g'), '');
  return `${integer}.${value.slice(last + 1)}`;
}

function normalizeDate(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const monthName = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const named = monthName.match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{2,4})/);
  if (named) {
    const month = MONTHS_PT_BR[named[2]];
    if (!month) return null;
    return formatDateParts(named[3], month, named[1]);
  }

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return formatDateParts(iso[1], iso[2], iso[3]);

  const local = raw.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (local) return formatDateParts(local[3], local[2], local[1]);

  return null;
}

function formatDateParts(
  yearInput: string,
  monthInput: string,
  dayInput: string,
): string | null {
  const year = yearInput.length === 2 ? `20${yearInput}` : yearInput;
  const month = monthInput.padStart(2, '0');
  const day = dayInput.padStart(2, '0');
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

function normalizeBoletoIdentifier(
  value: string | null | undefined,
): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, '');
  if ([44, 47, 48].includes(digits.length)) return `boleto:${digits}`;

  const compact = normalizeTextIdentifier(raw)?.replace(/\s/g, '');
  return compact && compact.length >= 5 ? `boleto:${compact}` : null;
}
