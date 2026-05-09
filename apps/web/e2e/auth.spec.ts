import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.beforeEach(async () => {
  await prisma.user.deleteMany({
    where: { email: 'playwright@test.local' },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
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
