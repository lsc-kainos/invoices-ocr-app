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

test('chat de nota: persiste após reload', async ({ page }) => {
  await loginAs(page, `playwright-chat-nota-${Date.now()}@test.local`);

  // Upload the invoice
  const upload = await uploadFile(page, INVOICE_JPG, 'invoice.jpg', 'image/jpeg');
  expect(upload.status()).toBe(201);
  const created = (await upload.json()) as { id: string; status: string };
  expect(created.status).toBe('QUEUED');

  // Wait until OCR processing completes
  const finished = await pollUntilReady(page, created.id);
  expect(finished.status).toBe('READY');

  // Navigate to document detail page
  await page.goto(`/documents/${created.id}`);

  // Click the "Conversa" tab
  await page.getByRole('tab', { name: 'Conversa' }).click();

  // Type a message and submit
  const input = page.locator('input[type="text"]');
  await input.fill('Qual o valor total?');
  await input.press('Enter');

  // Wait for the mock response (tool-call path: "valor total" triggers get_full_document)
  await expect(page.getByText('Encontrei essa informação no documento.')).toBeVisible({
    timeout: 10_000,
  });

  // Reload the page
  await page.reload();

  // Click the "Conversa" tab again after reload
  await page.getByRole('tab', { name: 'Conversa' }).click();

  // Verify the user's message persisted
  await expect(page.getByText('Qual o valor total?')).toBeVisible({ timeout: 10_000 });
});
