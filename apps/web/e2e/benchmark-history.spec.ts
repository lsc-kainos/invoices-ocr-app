import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'lsc@kainos-labs.com.br';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  await page.request.post('/api/auth/callback/e2e-test', {
    form: { csrfToken, email: ADMIN_EMAIL, callbackUrl: '/' },
    failOnStatusCode: false,
  });
  await page.goto('/');
}

const fakeAggregate = {
  avgScore: 0.85,
  passedCount: 1,
  failedCount: 1,
  perField: {},
  errorCounts: { refusal: 0, parse_error: 0, io_error: 0, unknown: 0 },
};

const fakeRun = {
  id: 'run-abc-123',
  runByEmail: 'lsc@kainos-labs.com.br',
  llmConfigKey: 'EXTRACTOR',
  llmConfigVersion: 1,
  modelSnapshot: 'gpt-4o',
  datasetVersion: 'v1',
  sampleCount: 2,
  aggregate: fakeAggregate,
  durationMs: 3000,
  createdAt: new Date().toISOString(),
};

const fakeRunDetail = {
  ...fakeRun,
  promptSnapshot: 'Extract invoice fields...',
  paramsSnapshot: { temperature: 0.2 },
  results: [{ filename: 'test.jpg', score: 0.8 }],
};

const sseBody = [
  `data: ${JSON.stringify({ type: 'progress', index: 1, total: 2, filename: 'test.jpg', score: 0.8, fieldResults: {} })}\n\n`,
  `data: ${JSON.stringify({ type: 'progress', index: 2, total: 2, filename: 'test2.jpg', score: 0.9, fieldResults: {} })}\n\n`,
  `data: ${JSON.stringify({ type: 'complete', aggregate: fakeAggregate })}\n\n`,
  `data: ${JSON.stringify({ type: 'persisted', runId: 'run-abc-123' })}\n\n`,
  'data: [DONE]\n\n',
].join('');

test.describe('admin /admin/benchmark — histórico', () => {
  test('executar benchmark mostra banner de run salvo', async ({ page }) => {
    await loginAsAdmin(page);

    await page.route('/api/admin/benchmark', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: sseBody,
        });
      } else {
        await route.continue();
      }
    });

    await page.route('/api/admin/benchmark/runs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([fakeRun]),
      });
    });

    await page.goto('/admin/benchmark');

    await page.getByRole('button', { name: 'Executar Benchmark' }).click();

    await expect(page.getByText('Run salvo')).toBeVisible({ timeout: 15_000 });
  });

  test('banner Ver no histórico navega para aba Histórico', async ({ page }) => {
    await loginAsAdmin(page);

    await page.route('/api/admin/benchmark', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: sseBody,
        });
      } else {
        await route.continue();
      }
    });

    await page.route('/api/admin/benchmark/runs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([fakeRun]),
      });
    });

    await page.goto('/admin/benchmark');

    await page.getByRole('button', { name: 'Executar Benchmark' }).click();

    await expect(page.getByText('Run salvo')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Ver no histórico' }).click();

    // The "Histórico" tab should now be selected
    await expect(page.getByRole('tab', { name: 'Histórico' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: 5_000 },
    );

    // The fake run row should be visible
    await expect(page.getByText('gpt-4o')).toBeVisible({ timeout: 10_000 });
  });

  test('aba Histórico carrega lista de runs', async ({ page }) => {
    await loginAsAdmin(page);

    await page.route('/api/admin/benchmark/runs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([fakeRun]),
      });
    });

    await page.route('/api/admin/benchmark/runs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeRunDetail),
      });
    });

    await page.goto('/admin/benchmark');

    await page.getByRole('tab', { name: 'Histórico' }).click();

    await expect(page.getByText('gpt-4o')).toBeVisible({ timeout: 10_000 });
  });

  test('clicar Ver abre dialog de detalhes do run', async ({ page }) => {
    await loginAsAdmin(page);

    await page.route('/api/admin/benchmark/runs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([fakeRun]),
      });
    });

    await page.route('/api/admin/benchmark/runs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeRunDetail),
      });
    });

    await page.goto('/admin/benchmark');

    await page.getByRole('tab', { name: 'Histórico' }).click();

    await expect(page.getByText('gpt-4o')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Ver' }).first().click();

    // Dialog should open showing prompt snapshot or model name
    await expect(page.getByText('Extract invoice fields...')).toBeVisible({ timeout: 10_000 });
  });
});
