const { PrismaClient, Role, LlmConfigKey } = require('@prisma/client');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const prisma = new PrismaClient();

async function main() {
  const extractorPromptPath = resolve(__dirname, './extractor-prompt.txt');
  const extractorPrompt = readFileSync(extractorPromptPath, 'utf-8');

  const systemUser = await prisma.user.upsert({
    where: { email: 'system@invoices-ocr.local' },
    update: {},
    create: {
      email: 'system@invoices-ocr.local',
      name: 'System',
      role: Role.ADMIN,
    },
  });

  // EXTRACTOR v1: só seedar se NENHUMA EXTRACTOR config existir ainda (deploy zero).
  // Em prod existente, v1 já foi seedada com prompt antigo (sem CLASSIFICATION/CONFIDENCE)
  // e o bloco v2 abaixo a desativa e ativa v2 com o prompt atualizado.
  const anyExtractor = await prisma.llmConfig.findFirst({
    where: { key: LlmConfigKey.EXTRACTOR },
  });
  if (anyExtractor) {
    console.log('EXTRACTOR já seedado, pulando v1.');
  } else {
    await prisma.llmConfig.create({
      data: {
        key: LlmConfigKey.EXTRACTOR,
        version: 1,
        model: process.env.OCR_MODEL ?? 'gpt-4o',
        prompt: extractorPrompt,
        params: { temperature: 0 },
        active: true,
        notes: 'Seed: prompt original importado de extractor.system.ts',
        createdBy: systemUser.id,
      },
    });
    console.log('Seed EXTRACTOR v1 criado.');
  }

  // EXTRACTOR v2: prompt com CLASSIFICATION + CONFIDENCE (ativa F3.2 — rejeição automática).
  // Idempotente: skip se v2 já existe. Caso contrário, desativa v1 ativa e cria v2 ativa
  // numa transação para garantir 0 ou 1 configs ativas por key.
  const existingV2 = await prisma.llmConfig.findFirst({
    where: { key: LlmConfigKey.EXTRACTOR, version: 2 },
  });
  if (existingV2) {
    console.log('EXTRACTOR v2 já existe, pulando seed.');
  } else {
    await prisma.$transaction([
      prisma.llmConfig.updateMany({
        where: { key: LlmConfigKey.EXTRACTOR, active: true },
        data: { active: false },
      }),
      prisma.llmConfig.create({
        data: {
          key: LlmConfigKey.EXTRACTOR,
          version: 2,
          model: process.env.OCR_MODEL ?? 'gpt-4o',
          prompt: extractorPrompt,
          params: { temperature: 0 },
          active: true,
          notes:
            'Seed: prompt v2 com CLASSIFICATION + CONFIDENCE para feature F3.2 (rejeição automática)',
          createdBy: systemUser.id,
        },
      }),
    ]);
    console.log('Seed EXTRACTOR v2 criado e ativo.');
  }

  const chatPromptPath = resolve(__dirname, './chat-prompt.txt');
  const chatPrompt = readFileSync(chatPromptPath, 'utf-8');

  const existingChat = await prisma.llmConfig.findFirst({
    where: { key: LlmConfigKey.CHAT, version: 1 },
  });
  if (existingChat) {
    console.log('CHAT v1 já existe, pulando seed.');
  } else {
    await prisma.llmConfig.create({
      data: {
        key: LlmConfigKey.CHAT,
        version: 1,
        model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
        prompt: chatPrompt,
        params: { temperature: 0.7 },
        active: true,
        notes:
          'Seed: regras base do chat (RULES) extraídas de chat/prompts/system.prompt.ts. Contexto dinâmico (documento/workspace) é concatenado em runtime.',
        createdBy: systemUser.id,
      },
    });
    console.log('Seed CHAT v1 criado.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
