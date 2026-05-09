import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

export type BenchmarkSample = {
  filename: string;
  groundTruth: {
    invoiceNumber: string | null;
    invoiceDate: string | null;
    dueDate: string | null;
    sellerName: string | null;
    clientName: string | null;
    tax: string | null;
    total: string | null;
  };
  items: Array<{ description: string; quantity: string; totalPrice: string }>;
  ocrText: string;
};

function nullIfEmpty(v: unknown): string | null {
  if (typeof v !== 'string' || v.trim() === '') return null;
  return v.trim();
}

function parseRow(row: Record<string, string>): BenchmarkSample {
  const data = JSON.parse(row['Json Data']) as Record<string, unknown>;
  const inv = (data['invoice'] ?? {}) as Record<string, string>;
  const sub = (data['subtotal'] ?? {}) as Record<string, string>;
  const rawItems = Array.isArray(data['items'])
    ? (data['items'] as Record<string, string>[])
    : [];

  return {
    filename: row['File Name'],
    groundTruth: {
      invoiceNumber: nullIfEmpty(inv['invoice_number']),
      invoiceDate: nullIfEmpty(inv['invoice_date']),
      dueDate: nullIfEmpty(inv['due_date']),
      sellerName: nullIfEmpty(inv['seller_name']),
      clientName: nullIfEmpty(inv['client_name']),
      tax: nullIfEmpty(sub['tax']),
      total: nullIfEmpty(sub['total']),
    },
    items: rawItems.map((it) => ({
      description: String(it['description'] ?? ''),
      quantity: String(it['quantity'] ?? ''),
      totalPrice: String(it['total_price'] ?? ''),
    })),
    ocrText: row['OCRed Text'] ?? '',
  };
}

export async function loadCsvSamples(
  samplesDir: string,
): Promise<BenchmarkSample[]> {
  const content = await fs.readFile(join(samplesDir, 'index.csv'), 'utf-8');
  const rows: Record<string, string>[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });
  return rows.map(parseRow);
}
