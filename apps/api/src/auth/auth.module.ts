import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { InternalServiceGuard } from './guards/internal-service.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, InternalServiceGuard],
  exports: [JwtStrategy, JwtAuthGuard, RolesGuard, InternalServiceGuard],
})
export class AuthModule {}
