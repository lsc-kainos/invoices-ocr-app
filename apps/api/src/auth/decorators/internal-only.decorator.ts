import { applyDecorators, UseGuards } from '@nestjs/common';
import { Public } from './public.decorator';
import { InternalServiceGuard } from '../guards/internal-service.guard';

// Marca rota como S2S: o JwtAuthGuard global ignora (via @Public) e o
// InternalServiceGuard valida o header x-internal-token. Use APENAS em
// rotas chamadas por outro serviço da nossa stack (web → api), nunca em
// rotas expostas ao usuário final.
export const InternalOnly = (): MethodDecorator & ClassDecorator =>
  applyDecorators(Public(), UseGuards(InternalServiceGuard));
