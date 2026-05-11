import { PrismaClient, Role, LlmConfigKey } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Polyfill __dirname para rodar sob ts-node ESM (em produção o entrypoint
// invoca `prisma db seed` e ts-node interpreta este arquivo como ESM, onde
// __dirname não existe). Em CJS o `typeof __dirname` já é 'string' e
// caímos no fallback. `import.meta.url` é referenciado via `eval` para
// evitar erro TS1470 quando o tsconfig resolve o módulo como CommonJS.
const __dirname_esm: string =
  typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(eval('import.meta.url') as string));

const prisma = new PrismaClient();

async function main() {
  const promptPath = resolve(__dirname_esm, './extractor-prompt.txt');
  const prompt = readFileSync(promptPath, 'utf-8');

  const systemUser = await prisma.user.upsert({
    where: { email: 'system@invoices-ocr.local' },
    update: {},
    create: {
      email: 'system@invoices-ocr.local',
      name: 'System',
      role: Role.ADMIN,
    },
  });

  const existing = await prisma.llmConfig.findFirst({
    where: { key: LlmConfigKey.EXTRACTOR, version: 1 },
  });
  if (existing) {
    console.log('EXTRACTOR v1 já existe, pulando seed.');
    return;
  }

  await prisma.llmConfig.create({
    data: {
      key: LlmConfigKey.EXTRACTOR,
      version: 1,
      model: process.env.OCR_MODEL ?? 'gpt-4o',
      prompt,
      params: { temperature: 0 },
      active: true,
      notes: 'Seed: prompt original importado de extractor.system.ts',
      createdBy: systemUser.id,
    },
  });
  console.log('Seed EXTRACTOR v1 criado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
