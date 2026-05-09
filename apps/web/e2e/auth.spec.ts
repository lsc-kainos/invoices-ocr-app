import { test, expect, type Page } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

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

test.beforeEach(async () => {
  await deleteTestUser('playwright@test.local');
});

async function loginAs(page: Page, email = 'playwright@test.local') {
  await page.goto('/login');
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  await page.request.post('/api/auth/callback/e2e-test', {
    form: { csrfToken, email, callbackUrl: '/' },
    failOnStatusCode: false,
  });
  await page.goto('/');
}

test('login via credentials provider e fetch /me', async ({ page }) => {
  await loginAs(page);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Nova nota', level: 1 })).toBeVisible();

  const me = await page.request.get('/api/v1/me');
  expect(me.ok()).toBe(true);
  const data = (await me.json()) as { email: string; role: string };
  expect(data.email).toBe('playwright@test.local');
  expect(data.role).toBe('USER');
});

test('logout volta para /login', async ({ page }) => {
  await loginAs(page);
  await page.getByRole('button', { name: /Conta/i }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('rota protegida sem login redireciona', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
