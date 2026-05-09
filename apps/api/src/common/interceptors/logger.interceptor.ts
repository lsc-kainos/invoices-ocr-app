import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

type ReqLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  user?: { id?: string };
};

type ResLike = { statusCode?: number };

// Interceptor global de request log. Emite uma linha por request:
//   [METHOD] /path status (Xms) user=<id|anon>
// Nunca loga headers, body de request ou body de response — só metadata.
// Razão: trafficamos tokens (Authorization), conteúdo de documento (PII)
// e dados de domínio (CNPJ, valores) que não podem ir pro stdout.
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<ReqLike>();
    const res = http.getResponse<ResLike>();
    const method = req.method ?? 'UNKNOWN';
    const path = req.originalUrl ?? req.url ?? '';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const dur = Date.now() - start;
        const status = res.statusCode ?? 200;
        const user = req.user?.id ?? 'anon';
        this.logger.log(
          `[${method}] ${path} ${status} (${dur}ms) user=${user}`,
        );
      }),
      catchError((err: unknown) => {
        const dur = Date.now() - start;
        const status = err instanceof HttpException ? err.getStatus() : 500;
        const user = req.user?.id ?? 'anon';
        const name = err instanceof Error ? err.constructor.name : 'Error';
        this.logger.warn(
          `[${method}] ${path} ${status} (${dur}ms) user=${user} error=${name}`,
        );
        return throwError(() => err);
      }),
    );
  }
}
