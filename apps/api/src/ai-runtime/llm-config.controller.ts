import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { LlmConfig, LlmConfigKey, Prisma } from '@prisma/client';
import { LlmConfigService } from './llm-config.service';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { TestLlmConfigDto } from './dto/test-llm-config.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { availableModels } from './providers/available-models';
import { resolve } from 'node:path';
import { promises as fs } from 'node:fs';
import { AiRuntimeService } from './ai-runtime.service';
import { invoiceSummarySchema } from '../ocr/schemas/invoice-summary.schema';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string };
}

type LlmConfigWithCreator = LlmConfig & { creator?: { email: string } };

@Controller('api/v1/admin/llm-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class LlmConfigController {
  constructor(
    private readonly service: LlmConfigService,
    private readonly config: ConfigService,
    private readonly runtime: AiRuntimeService,
  ) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async list() {
    const all = await this.service.listAll();
    return all.map((c) => this.toDto(c));
  }

  @Get('available-models')
  getAvailableModels() {
    return availableModels(process.env);
  }

  @Get('active/:key')
  async findActive(@Param('key') key: string) {
    const cfg = await this.service.findActive(key as LlmConfigKey);
    if (!cfg) throw new NotFoundException();
    return this.toDto(cfg);
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async create(@Body() dto: CreateLlmConfigDto, @Req() req: AuthRequest) {
    const allowed = availableModels(process.env);
    if (!allowed.some((m) => m.id === dto.model)) {
      throw new BadRequestException(
        `Model '${dto.model}' is not available. Available: ${allowed.map((m) => m.id).join(', ')}`,
      );
    }
    const created = await this.service.createVersion(req.user.id, {
      key: dto.key,
      model: dto.model,
      prompt: dto.prompt,
      params: (dto.params ?? {}) as Prisma.JsonObject,
      notes: dto.notes,
    });
    return this.toDto(created);
  }

  @Post(':id/activate')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async activate(@Param('id') id: string) {
    const result = await this.service.activate(id);
    return this.toDto(result);
  }

  @Post(':id/test')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async test(@Param('id') id: string, @Body() dto: TestLlmConfigDto) {
    const all = await this.service.listAll();
    const cfg = all.find((c) => c.id === id);
    if (!cfg) throw new NotFoundException();

    const samplesDir = resolve(
      this.config.get<string>('BENCHMARK_DATASET_DIR') ??
        '../../samples/invoice-dataset',
    );
    const safePath = resolve(samplesDir, dto.sampleFilename);
    if (!safePath.startsWith(samplesDir + '/')) {
      throw new NotFoundException('sample fora do diretório permitido');
    }

    const buf = await fs.readFile(safePath);
    const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;

    const start = Date.now();
    try {
      const result = await this.runtime.generateObject({
        key: cfg.key,
        schema: invoiceSummarySchema,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraia os dados conforme o schema.' },
              { type: 'image', image: dataUrl },
            ],
          },
        ],
        overrides: {
          model: cfg.model,
          prompt: cfg.prompt,
          params: cfg.params as Record<string, unknown>,
        },
      });
      return { ok: true, result, durationMs: Date.now() - start };
    } catch (err: unknown) {
      const e = err as { message?: string; name?: string };
      const errorClass = e.message?.startsWith('refusal:')
        ? 'refusal'
        : e.name === 'ZodError'
          ? 'parse-error'
          : 'unknown';
      return {
        ok: false,
        error: e.message,
        errorClass,
        durationMs: Date.now() - start,
      };
    }
  }

  @Post('reload-cache')
  reload() {
    return { invalidated: this.service.reloadCache() };
  }

  private toDto(c: LlmConfigWithCreator) {
    return {
      id: c.id,
      key: c.key,
      version: c.version,
      model: c.model,
      prompt: c.prompt,
      params: c.params,
      active: c.active,
      notes: c.notes,
      createdAt:
        c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      createdBy: c.createdBy,
      createdByEmail: c.creator?.email ?? null,
    };
  }
}
