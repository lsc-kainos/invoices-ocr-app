import { test, expect, type Page } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

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

test('chat global: criar conversa, alternar entre sessões', async ({ page }) => {
  await loginAs(page, `playwright-chat-global-${Date.now()}@test.local`);

  await page.getByRole('link', { name: 'Chat' }).click();
  await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });

  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await expect(page).toHaveURL(/\/chat\/[^/]+$/, { timeout: 10_000 });
  const firstSessionUrl = page.url();

  const input = page.locator('input[type="text"]');
  await input.fill('Olá');
  await input.press('Enter');
  await expect(page.getByText('Resposta mock.')).toBeVisible({ timeout: 10_000 });

  // Create a second session — URL must differ from session 1
  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await expect(page).toHaveURL(/\/chat\/[^/]+$/, { timeout: 10_000 });
  expect(page.url()).not.toBe(firstSessionUrl);

  await input.fill('Outra pergunta');
  await input.press('Enter');
  await expect(page.getByText('Resposta mock.')).toBeVisible({ timeout: 10_000 });

  // Sessions are sorted by updatedAt desc — session 2 is now first in sidebar.
  // Navigate to session 1 via its title ("Olá" from titleFromContent).
  await page.getByRole('link', { name: 'Olá' }).click();
  await expect(page.getByText('Olá')).toBeVisible({ timeout: 10_000 });
});
