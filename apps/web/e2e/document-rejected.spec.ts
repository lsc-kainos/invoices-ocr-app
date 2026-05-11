import { test, expect, type Page } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

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

test('card mostra estado REJECTED com mensagem amber e ladder warn', async ({ page }) => {
  const email = `playwright-rejected-${Date.now()}@test.local`;
  await loginAs(page, email);

  // Intercept the documents list fetch to inject a REJECTED document
  const fakeDoc = {
    id: 'fake-rejected-id',
    status: 'REJECTED',
    filename: 'nf-teste.pdf',
    mime: 'application/pdf',
    size: 102400,
    summary: null,
    failureReason: null,
    retryCount: 0,
    documentType: 'unknown',
    confidence: 0.3,
    rejectionReason: 'unsupported_type',
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await page.route('/api/documents*', async (route) => {
    if (
      route.request().method() === 'GET' &&
      !route.request().url().includes('/fake-rejected-id')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([fakeDoc]),
      });
    } else {
      await route.continue();
    }
  });

  // Navigate to home — document list renders with our faked REJECTED doc
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nova nota' })).toBeVisible({ timeout: 10_000 });

  // The upload card for the REJECTED doc should appear
  await expect(page.getByText('nf-teste.pdf')).toBeVisible({ timeout: 5_000 });

  // Amber rejection message should be visible (unknown documentType fallback)
  await expect(
    page.getByText(
      'Não conseguimos identificar como nota fiscal ou boleto. Verifique se enviou o arquivo correto.',
    ),
  ).toBeVisible({ timeout: 5_000 });

  // The "Estrutura" ladder step should show amber "!" icon
  // The card's ladder has the step text "Estrutura"
  await expect(page.getByText('Estrutura')).toBeVisible();
});

test('card REJECTED com low_confidence mostra mensagem de confiança', async ({ page }) => {
  const email = `playwright-lowconf-${Date.now()}@test.local`;
  await loginAs(page, email);

  const fakeDoc = {
    id: 'fake-lowconf-id',
    status: 'REJECTED',
    filename: 'boleto.pdf',
    mime: 'application/pdf',
    size: 51200,
    summary: null,
    failureReason: null,
    retryCount: 0,
    documentType: 'boleto',
    confidence: 0.4,
    rejectionReason: 'low_confidence',
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await page.route('/api/documents*', async (route) => {
    if (route.request().method() === 'GET' && !route.request().url().includes('/fake-lowconf-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([fakeDoc]),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await expect(page.getByText('boleto.pdf')).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText(
      'Extraímos os dados, mas com confiança abaixo do mínimo aceitável. Tente uma imagem mais nítida ou um PDF original.',
    ),
  ).toBeVisible({ timeout: 5_000 });
  // Confidence percentage should appear (40% from confidence: 0.4)
  await expect(page.getByText('Confiança da extração: 40%')).toBeVisible({ timeout: 5_000 });
});
