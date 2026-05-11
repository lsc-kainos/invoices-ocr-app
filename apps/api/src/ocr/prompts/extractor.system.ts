import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const EXTRACTOR_SYSTEM_PROMPT = readFileSync(
  resolve(__dirname, '../../../prisma/extractor-prompt.txt'),
  'utf-8',
);
