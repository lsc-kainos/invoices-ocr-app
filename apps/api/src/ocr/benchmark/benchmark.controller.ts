import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { resolve } from 'node:path';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role, type User } from '@prisma/client';
import { BenchmarkService } from './benchmark.service';
import { BenchmarkPersistenceService } from './benchmark-persistence.service';
import type {
  BenchmarkRunDetailDto,
  BenchmarkRunDto,
} from '@invoices-ocr/shared-types';

@Controller('api/v1/admin')
@Roles(Role.ADMIN)
export class BenchmarkController {
  constructor(
    private readonly benchmark: BenchmarkService,
    private readonly config: ConfigService,
    private readonly persistence: BenchmarkPersistenceService,
  ) {}

  @Post('benchmark')
  @Throttle({ benchmark: { ttl: 3_600_000, limit: 5 } })
  async run(@Res() res: Response, @CurrentUser() user: User): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const configured = this.config.get<string>('BENCHMARK_DATASET_DIR');
    const samplesDir = configured
      ? resolve(configured)
      : resolve(process.cwd(), '../../samples/invoice-dataset');

    for await (const event of this.benchmark.runStream(samplesDir, user.id)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  @Get('benchmark/runs')
  async listRuns(
    @Query('limit') limitStr?: string,
  ): Promise<BenchmarkRunDto[]> {
    const limit = Math.min(limitStr ? parseInt(limitStr, 10) : 20, 100);
    return this.persistence.list(limit);
  }

  @Get('benchmark/runs/:id')
  async getRun(@Param('id') id: string): Promise<BenchmarkRunDetailDto> {
    const run = await this.persistence.findById(id);
    if (!run) throw new NotFoundException(`BenchmarkRun ${id} not found`);
    return run;
  }
}
