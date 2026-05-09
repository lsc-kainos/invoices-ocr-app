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

  // Navigate to chat via the topbar "Chat" link
  await page.getByRole('link', { name: 'Chat' }).click();
  await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });

  // Click "Nova conversa" to create first session
  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await expect(page).toHaveURL(/\/chat\/[^/]+$/, { timeout: 10_000 });

  // Send first message in first session
  const input = page.locator('input[type="text"]');
  await input.fill('Olá');
  await input.press('Enter');

  // Wait for mock response
  await expect(page.getByText('Resposta mock.')).toBeVisible({ timeout: 10_000 });

  // Create a second session
  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await expect(page).toHaveURL(/\/chat\/[^/]+$/, { timeout: 10_000 });

  // Send second message in second session
  const input2 = page.locator('input[type="text"]');
  await input2.fill('Outra pergunta');
  await input2.press('Enter');

  // Wait for mock response in second session
  await expect(page.getByText('Resposta mock.')).toBeVisible({ timeout: 10_000 });

  // Click the first session link in the sidebar (the one with "Olá" or first listed)
  // Sessions are listed in the sidebar as links; click the first one
  const firstSession = page.locator('aside nav a').first();
  await firstSession.click();

  // Verify the "Olá" message is visible in the first session
  await expect(page.getByText('Olá')).toBeVisible({ timeout: 10_000 });
});
