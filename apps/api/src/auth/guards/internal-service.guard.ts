import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';

const HEADER = 'x-internal-token';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    // Express normaliza header keys pra lowercase; HEADER já está nesse formato
    const raw = req.headers[HEADER];
    if (typeof raw !== 'string' || raw.length === 0) {
      throw new UnauthorizedException();
    }

    const expected = this.config.get<string>('INTERNAL_SERVICE_TOKEN') ?? '';
    if (!expected) throw new UnauthorizedException();

    // Hash dos dois lados pra ter buffers de comprimento fixo (32 bytes do
    // SHA-256). Sem isso, timingSafeEqual lança RangeError quando lengths
    // diferem — vazando o length real do segredo via exception.
    const a = createHash('sha256').update(raw).digest();
    const b = createHash('sha256').update(expected).digest();
    if (!timingSafeEqual(a, b)) throw new UnauthorizedException();
    return true;
  }
}
