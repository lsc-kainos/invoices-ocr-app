import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmConfig, LlmConfigKey, Prisma } from '@prisma/client';

const CACHE_TTL_MS = 60_000;

type CacheEntry = { config: LlmConfig; expiresAt: number };

@Injectable()
export class LlmConfigService {
  private cache = new Map<LlmConfigKey, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async findActive(key: LlmConfigKey): Promise<LlmConfig | null> {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.config;

    const config = await this.prisma.llmConfig.findFirst({
      where: { key, active: true },
    });
    if (config) {
      this.cache.set(key, { config, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return config;
  }

  async createVersion(
    userId: string,
    input: {
      key: LlmConfigKey;
      model: string;
      prompt: string;
      params: Prisma.JsonObject;
      notes?: string;
    },
  ): Promise<LlmConfig> {
    const last = await this.prisma.llmConfig.findFirst({
      where: { key: input.key },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (last?.version ?? 0) + 1;

    return this.prisma.llmConfig.create({
      data: {
        key: input.key,
        version: nextVersion,
        model: input.model,
        prompt: input.prompt,
        params: input.params,
        notes: input.notes ?? null,
        active: false,
        createdBy: userId,
      },
    });
  }

  async activate(id: string): Promise<LlmConfig> {
    const target = await this.prisma.llmConfig.findUnique({ where: { id } });
    if (!target) throw new NotFoundException(`LlmConfig ${id} not found`);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.llmConfig.updateMany({
        where: { key: target.key, active: true },
        data: { active: false },
      });
      return tx.llmConfig.update({
        where: { id: target.id },
        data: { active: true },
      });
    });

    this.cache.delete(target.key);
    return result;
  }

  async listAll(): Promise<
    (LlmConfig & { creator: { email: string } | null })[]
  > {
    return this.prisma.llmConfig.findMany({
      orderBy: [{ key: 'asc' }, { version: 'desc' }],
      include: { creator: { select: { email: true } } },
    });
  }

  reloadCache(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }
}
