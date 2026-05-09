import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import type { User } from '@prisma/client';

const SECRET = 'a'.repeat(32);

const hasDb = !!process.env.DATABASE_URL;
const describeOrSkip = hasDb ? describe : describe.skip;

interface DocumentSummaryResponse {
  id: string;
  status: 'QUEUED' | 'OCR_RUNNING' | 'READY' | 'FAILED';
  filename: string;
}

interface DocumentDetailResponse extends DocumentSummaryResponse {
  extractedText: string | null;
  summary: { core: Record<string, unknown> } | null;
  fileUrl: string;
}

describeOrSkip('Documents pipeline (e2e, mock provider)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let volumeRoot: string;
  let resolveUser: (token: string) => Promise<User | null>;

  beforeAll(async () => {
    volumeRoot = mkdtempSync(join(tmpdir(), 'e2e-vol-'));
    process.env.VOLUME_ROOT = volumeRoot;
    process.env.STORAGE_URL_SECRET = SECRET;
    process.env.OCR_PROVIDER = 'mock';
    process.env.UPLOAD_MAX_BYTES = '10485760';
    process.env.ALLOWED_ORIGINS =
      process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(JwtStrategy)
      .useValue({
        decryptAndValidate: async (token: string) => resolveUser(token),
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    resolveUser = (token: string) =>
      prisma.user.findUnique({ where: { id: token } });
  });

  afterAll(async () => {
    if (app) {
      await prisma.document.deleteMany();
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'e2e-' } },
      });
      await prisma.$disconnect();
      await app.close();
    }
    rmSync(volumeRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await prisma.document.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-' } },
    });
  });

  const authHeader = (userId: string) => ({
    Authorization: `Bearer ${userId}`,
  });

  const sample = () =>
    readFileSync(
      join(__dirname, '..', '..', '..', 'samples', 'invoice-en.jpg'),
    );

  it('happy: upload → poll até READY → detail tem extractedText e summary.core', async () => {
    const user = await prisma.user.create({
      data: { email: `e2e-a-${Date.now()}@x.com` },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set(authHeader(user.id))
      .attach('file', sample(), 'invoice.jpg')
      .expect(201);
    const docId = (res.body as DocumentSummaryResponse).id;
    expect((res.body as DocumentSummaryResponse).status).toBe('QUEUED');

    // Mock provider tem delay fixo de 800ms; aguardamos com folga e
    // pollamos poucas vezes para não saturar o throttler in-memory
    // compartilhado entre testes.
    let status: string = 'QUEUED';
    for (let i = 0; i < 10 && status !== 'READY' && status !== 'FAILED'; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const list = await request(app.getHttpServer())
        .get('/api/v1/documents')
        .set(authHeader(user.id))
        .expect(200);
      const found = (list.body as DocumentSummaryResponse[]).find(
        (d) => d.id === docId,
      );
      status = found?.status ?? status;
    }
    expect(status).toBe('READY');

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/documents/${docId}`)
      .set(authHeader(user.id))
      .expect(200);
    const detailBody = detail.body as DocumentDetailResponse;
    expect(detailBody.extractedText).toBeTruthy();
    expect(detailBody.summary?.core).toBeDefined();
    expect(detailBody.fileUrl).toMatch(/^\/api\/v1\/documents\//);
  }, 30_000);

  it('ownership: user B não vê documento de user A → 404 + lista vazia', async () => {
    const a = await prisma.user.create({
      data: { email: `e2e-a2-${Date.now()}@x.com` },
    });
    const b = await prisma.user.create({
      data: { email: `e2e-b2-${Date.now()}@x.com` },
    });

    const created = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set(authHeader(a.id))
      .attach('file', sample(), 'invoice.jpg')
      .expect(201);
    const docId = (created.body as DocumentSummaryResponse).id;

    await request(app.getHttpServer())
      .get(`/api/v1/documents/${docId}`)
      .set(authHeader(b.id))
      .expect(404);

    const listB = await request(app.getHttpServer())
      .get('/api/v1/documents')
      .set(authHeader(b.id))
      .expect(200);
    expect(listB.body).toEqual([]);
  });

  it('signed URL: token válido → 200 com mime correto; token expirado → 401', async () => {
    const user = await prisma.user.create({
      data: { email: `e2e-c-${Date.now()}@x.com` },
    });
    const created = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set(authHeader(user.id))
      .attach('file', sample(), 'invoice.jpg')
      .expect(201);
    const docId = (created.body as DocumentSummaryResponse).id;

    // Aguarda mock terminar (800ms de delay); checa status uma vez.
    await new Promise((r) => setTimeout(r, 1500));

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/documents/${docId}`)
      .set(authHeader(user.id))
      .expect(200);
    const fileUrl = (detail.body as DocumentDetailResponse).fileUrl;

    const ok = await request(app.getHttpServer()).get(fileUrl).expect(200);
    expect(ok.headers['content-type']).toMatch(/^image\/jpeg/);

    const expiredExp = Math.floor(Date.now() / 1000) - 1;
    const sig = createHmac('sha256', SECRET)
      .update(`${docId}.${user.id}.${expiredExp}`)
      .digest('hex');
    await request(app.getHttpServer())
      .get(`/api/v1/documents/${docId}/file?token=${expiredExp}.${sig}`)
      .expect(401);
  }, 30_000);

  it('upload de .docx → 400', async () => {
    const user = await prisma.user.create({
      data: { email: `e2e-d-${Date.now()}@x.com` },
    });
    const docx = Buffer.from([
      0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00,
    ]);
    await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set(authHeader(user.id))
      .attach('file', docx, 'doc.docx')
      .expect(400);
  });
});
