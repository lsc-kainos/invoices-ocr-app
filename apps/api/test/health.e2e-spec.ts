import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Requer Postgres rodando localmente (via `npm run db:up`) para passar.
// CI: depende do job ter Postgres como service. Por ora skipa se DATABASE_URL ausente.
const hasDb = !!process.env.DATABASE_URL;
const describeOrSkip = hasDb ? describe : describe.skip;

describeOrSkip('GET /health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';

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
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.ts).toBe('string');
  });
});
