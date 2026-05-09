import { Controller, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { join } from 'node:path';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BenchmarkService } from './benchmark.service';

@Controller('api/v1/admin')
@Roles(Role.ADMIN)
export class BenchmarkController {
  constructor(private readonly benchmark: BenchmarkService) {}

  @Post('benchmark')
  @Throttle({ benchmark: { ttl: 3_600_000, limit: 5 } })
  async run(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const samplesDir = join(process.cwd(), '../../samples/invoice-dataset');

    for await (const event of this.benchmark.runStream(samplesDir)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }
}
