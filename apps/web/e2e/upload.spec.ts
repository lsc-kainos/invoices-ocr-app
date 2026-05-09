import { test, expect, type Page } from '@playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

const SAMPLES_DIR = join(__dirname, '..', '..', '..', 'samples');
const INVOICE_JPG = join(SAMPLES_DIR, 'invoice-en.jpg');

const createdEmails = new Set<string>();

async function deleteTestUser(email: string) {
  await fetch(`${API_URL}/api/v1/internal/users/by-email`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': INTERNAL_TOKEN,
    },
    body: JSON.stringify({ email }),
  }).catch(() => undefined);
}

test.afterAll(async () => {
  for (const email of createdEmails) {
    await deleteTestUser(email);
  }
});

async function loginAs(page: Page, email: string) {
  createdEmails.add(email);
  await page.goto('/login');
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  await page.request.post('/api/auth/callback/e2e-test', {
    form: { csrfToken, email, callbackUrl: '/' },
    failOnStatusCode: false,
  });
  await page.goto('/');
}

async function uploadFile(page: Page, filePath: string, filename: string, mime: string) {
  const buf = readFileSync(filePath);
  return page.request.post('/api/upload', {
    multipart: {
      file: { name: filename, mimeType: mime, buffer: buf },
    },
    failOnStatusCode: false,
  });
}

async function pollUntilReady(
  page: Page,
  docId: string,
  maxAttempts = 6,
  delayMs = 2000,
): Promise<{ status: string; extractedText: string | null }> {
  for (let i = 0; i < maxAttempts; i++) {
    await page.waitForTimeout(delayMs);
    const r = await page.request.get(`/api/documents/${docId}`, {
      failOnStatusCode: false,
    });
    if (r.ok()) {
      const body = (await r.json()) as {
        status: string;
        extractedText: string | null;
      };
      if (body.status === 'READY' || body.status === 'FAILED') return body;
    }
  }
  throw new Error('document never reached READY/FAILED');
}

test('upload via API → READY → detail page renderiza com texto bruto', async ({ page }) => {
  await loginAs(page, `playwright-up-${Date.now()}@test.local`);

  // Confirma que a home renderiza a página de upload
  await expect(page.getByRole('heading', { name: 'Nova nota', level: 1 })).toBeVisible({
    timeout: 15_000,
  });

  // Upload via API (mais determinístico que setInputFiles + dropzone)
  const upload = await uploadFile(page, INVOICE_JPG, 'invoice.jpg', 'image/jpeg');
  expect(upload.status()).toBe(201);
  const created = (await upload.json()) as { id: string; status: string };
  expect(created.status).toBe('QUEUED');

  // Aguarda processamento (mock = ~800ms)
  const finished = await pollUntilReady(page, created.id);
  expect(finished.status).toBe('READY');
  expect(finished.extractedText).toBeTruthy();

  // Navega para detail page
  await page.goto(`/documents/${created.id}`);
  await expect(page.getByRole('heading', { name: 'Campos extraídos' })).toBeVisible({
    timeout: 10_000,
  });

  // Tab "Texto bruto" mostra o conteúdo
  await page.getByRole('tab', { name: 'Texto bruto' }).click();
  await expect(page.locator('pre')).toContainText(/.+/, { timeout: 10_000 });
});

test('card otimista aparece com progresso antes do card servidor', async ({ page }) => {
  await loginAs(page, `playwright-opt-${Date.now()}@test.local`);

  // Confirma que a home renderizou (dropzone visível)
  await expect(page.getByRole('heading', { name: 'Nova nota', level: 1 })).toBeVisible({
    timeout: 15_000,
  });

  // Dispara upload via input do dropzone (react-dropzone expõe <input type="file">)
  const input = page.locator('input[type=file]');
  await input.setInputFiles(INVOICE_JPG);

  // O card otimista deve aparecer imediatamente (dentro de 2s) enquanto o XHR ainda está em voo
  await expect(page.getByTestId('optimistic-upload-card').first()).toBeVisible({ timeout: 2000 });

  // Após o upload completar, um card real do servidor deve aparecer (QUEUED / OCR_RUNNING / READY)
  await expect(page.getByText(/Na fila|Extraindo|Pronta/)).toBeVisible({ timeout: 15_000 });
});

test.skip('botão "Tentar de novo" reenvia doc FAILED para QUEUED', async ({ page }) => {
  // requer OCR_PROVIDER=mock-fail (provider que sempre falha) — fora de escopo desta entrega
  void page;
});

test('upload arquivo não suportado → 400', async ({ page }) => {
  await loginAs(page, `playwright-bad-${Date.now()}@test.local`);
  const docx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00]);
  const r = await page.request.post('/api/upload', {
    multipart: {
      file: { name: 'fake.docx', mimeType: 'application/octet-stream', buffer: docx },
    },
    failOnStatusCode: false,
  });
  expect(r.status()).toBe(400);
});

test('user A não vê documento de user B → 404', async ({ page }) => {
  const emailA = `playwright-a-${Date.now()}@test.local`;
  const emailB = `playwright-b-${Date.now()}@test.local`;
  await loginAs(page, emailA);
  const upload = await uploadFile(page, INVOICE_JPG, 'invoice.jpg', 'image/jpeg');
  expect(upload.status()).toBe(201);
  const created = (await upload.json()) as { id: string };

  // Logout
  await page.getByRole('button', { name: /Conta/i }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);

  // Login como B
  await loginAs(page, emailB);

  // GET ao doc de A → 404
  const r = await page.request.get(`/api/documents/${created.id}`, {
    failOnStatusCode: false,
  });
  expect(r.status()).toBe(404);
});
