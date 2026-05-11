import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { MetricsService } from './metrics.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { MetricsResponseDto } from './dto/metrics-response.dto';

@Controller('api/v1/admin/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  getMetrics(): Promise<MetricsResponseDto> {
    return this.service.getMetrics();
  }
}
