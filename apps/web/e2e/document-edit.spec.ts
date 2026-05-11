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
    headers: { 'Content-Type': 'application/json', 'x-internal-token': INTERNAL_TOKEN },
    body: JSON.stringify({ email }),
  }).catch(() => undefined);
}

test.afterAll(async () => {
  for (const email of createdEmails) await deleteTestUser(email);
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

async function pollUntilReady(
  page: Page,
  docId: string,
  maxAttempts = 8,
  delayMs = 2000,
): Promise<{ status: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await page.waitForTimeout(delayMs);
    const r = await page.request.get(`/api/documents/${docId}`, { failOnStatusCode: false });
    if (r.ok()) {
      const body = (await r.json()) as { status: string };
      if (body.status === 'READY' || body.status === 'FAILED') return body;
    }
  }
  throw new Error('document never reached READY/FAILED');
}

test('READY document: Editar → altera campo → Salvar → VerifiedBadge aparece', async ({ page }) => {
  const email = `playwright-edit-${Date.now()}@test.local`;
  await loginAs(page, email);

  // Upload via API
  const buf = readFileSync(INVOICE_JPG);
  const upload = await page.request.post('/api/upload', {
    multipart: { file: { name: 'invoice.jpg', mimeType: 'image/jpeg', buffer: buf } },
    failOnStatusCode: false,
  });
  expect(upload.status()).toBe(201);
  const created = (await upload.json()) as { id: string };

  // Wait for READY
  const finished = await pollUntilReady(page, created.id);
  expect(finished.status).toBe('READY');

  // Navigate to detail page
  await page.goto(`/documents/${created.id}`);
  await expect(page.getByRole('heading', { name: 'Campos extraídos' })).toBeVisible({
    timeout: 10_000,
  });

  // "Editar" button should be visible (READY doc)
  const editBtn = page.getByRole('button', { name: 'Editar' });
  await expect(editBtn).toBeVisible({ timeout: 5_000 });
  await editBtn.click();

  // Fields become editable — input for "Emissor" (sellerName) should appear
  // Find any visible input inside the rail
  const firstInput = page.locator('aside input').first();
  await expect(firstInput).toBeVisible({ timeout: 3_000 });

  // Change the narrative textarea
  const narrativeArea = page.locator('aside textarea');
  await narrativeArea.fill('Texto editado pelo teste E2E');

  // Intercept the PATCH to verify it fires and returns 200
  let patchFired = false;
  await page.route(`/api/documents/${created.id}/summary`, (route) => {
    patchFired = true;
    void route.continue();
  });

  // Click Salvar
  await page.getByRole('button', { name: 'Salvar' }).click();

  // Wait for VerifiedBadge to appear
  await expect(page.getByText('Verificado')).toBeVisible({ timeout: 10_000 });
  expect(patchFired).toBe(true);
});

test('Cancelar descarta alterações sem chamar API', async ({ page }) => {
  const email = `playwright-cancel-${Date.now()}@test.local`;
  await loginAs(page, email);

  const buf = readFileSync(INVOICE_JPG);
  const upload = await page.request.post('/api/upload', {
    multipart: { file: { name: 'invoice.jpg', mimeType: 'image/jpeg', buffer: buf } },
    failOnStatusCode: false,
  });
  expect(upload.status()).toBe(201);
  const created = (await upload.json()) as { id: string };
  await pollUntilReady(page, created.id);

  await page.goto(`/documents/${created.id}`);
  await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Editar' }).click();

  // Intercept PATCH — should NOT be called
  let patchFired = false;
  await page.route(`/api/documents/${created.id}/summary`, (route) => {
    patchFired = true;
    void route.continue();
  });

  await page.getByRole('button', { name: 'Cancelar' }).click();

  // "Editar" button returns, inputs disappear
  await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('aside textarea')).not.toBeVisible();
  expect(patchFired).toBe(false);
});
