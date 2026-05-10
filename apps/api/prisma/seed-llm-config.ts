import { PrismaClient, Role, LlmConfigKey } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

async function main() {
  const promptPath = resolve(
    __dirname,
    '../src/ocr/prompts/extractor.system.ts',
  );
  const fileContent = readFileSync(promptPath, 'utf-8');
  const match = fileContent.match(/`([\s\S]*?)`;/);
  if (!match) throw new Error('Não encontrei prompt em extractor.system.ts');
  const prompt = match[1];

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
