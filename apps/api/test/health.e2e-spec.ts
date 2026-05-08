import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

interface HealthResponse {
  status: string;
  ts: string;
}

// Requer Postgres rodando localmente (via `npm run db:up`) para passar.
// Skipa quando DATABASE_URL ausente (ex: CI sem job Postgres).
const hasDb = !!process.env.DATABASE_URL;
const describeOrSkip = hasDb ? describe : describe.skip;

describeOrSkip('GET /health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.ALLOWED_ORIGINS =
      process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.get(PrismaService).$disconnect();
      await app.close();
    }
  });

  it('responde 200 com status ok quando o banco está disponível', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as HealthResponse;
    expect(body.status).toBe('ok');
    expect(typeof body.ts).toBe('string');
  });
});
