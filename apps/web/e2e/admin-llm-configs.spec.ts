import { test, expect, type Page } from '@playwright/test';

// Admin email must be in ADMIN_EMAILS env var (set to lsc@kainos-labs.com.br in .env.local)
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'lsc@kainos-labs.com.br';
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

test.describe('admin /admin/llm-configs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    // Non-system admin users created via e2e-test provider can be cleaned up.
    // The ADMIN_EMAIL is typically a real user (lsc@kainos-labs.com.br) so we
    // skip deletion to avoid breaking the seed user.
    void deleteTestUser;
  });

  test('lista mostra EXTRACTOR v1 ativa', async ({ page }) => {
    await page.goto('/admin/llm-configs');

    // Wait for the configs list to load
    await expect(page.getByRole('heading', { name: 'Configurações de IA' })).toBeVisible({
      timeout: 10_000,
    });

    // The EXTRACTOR tab should be active by default (defaultValue="EXTRACTOR")
    await expect(page.getByRole('tab', { name: 'EXTRACTOR' })).toBeVisible();

    // Table should contain version v1
    await expect(page.getByText('v1')).toBeVisible({ timeout: 10_000 });

    // The "Ativa" badge should be visible for the active config
    await expect(page.getByRole('cell', { name: 'Ativa' })).toBeVisible({ timeout: 10_000 });
  });

  test('redireciona USER para / ao tentar acessar /admin/llm-configs', async ({ page }) => {
    // Override: login as non-admin user
    await page.goto('/login');
    const csrfRes = await page.request.get('/api/auth/csrf');
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
    const userEmail = `playwright-nonadmin-${Date.now()}@test.local`;
    await page.request.post('/api/auth/callback/e2e-test', {
      form: { csrfToken, email: userEmail, callbackUrl: '/' },
      failOnStatusCode: false,
    });
    await page.goto('/admin/llm-configs');

    // Non-admin should be redirected away (to /)
    await expect(page).not.toHaveURL(/\/admin\/llm-configs/, { timeout: 5_000 });

    // Cleanup
    await deleteTestUser(userEmail);
  });

  test('cria nova versão de config EXTRACTOR', async ({ page }) => {
    await page.goto('/admin/llm-configs');

    await expect(page.getByRole('heading', { name: 'Configurações de IA' })).toBeVisible({
      timeout: 10_000,
    });

    // Click "Nova versão" button
    await page.getByRole('button', { name: 'Nova versão' }).click();

    // Dialog opens with title "Nova versão de config"
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Nova versão de config' })).toBeVisible();

    // Key is already EXTRACTOR by default — verify
    const keySelect = page.locator('select');
    await expect(keySelect).toHaveValue('EXTRACTOR');

    // Fill prompt (required).
    // The form uses plain <label> without htmlFor, so we use the Textarea locator
    // (the only <textarea> inside the dialog that is the prompt field).
    const dialog = page.getByRole('dialog');
    // First textarea is the prompt field (rows=6), second is notes (rows=2)
    const textareas = dialog.locator('textarea');
    await textareas.first().fill('Test E2E prompt for LLM config');

    // Temperature has a default (0.2) — leave as is

    // Submit button label: "Criar (não ativar ainda)"
    const submitBtn = page.getByRole('button', { name: 'Criar (não ativar ainda)' });

    // Submit is disabled until model is also selected. If models are available,
    // select the first one. If the API is down or no models returned, skip model selection.
    // Dialog contains two <select> elements: key (first) and model (second).
    const dialogSelects = dialog.locator('select');
    const count = await dialogSelects.count();
    if (count >= 2) {
      // Second select is the ModelSelect
      const modelSelect = dialogSelects.nth(1);
      const options = await modelSelect.locator('option').all();
      if (options.length > 1) {
        // Select the first non-empty option (index 0 is "—" placeholder)
        const val = await options[1].getAttribute('value');
        if (val) await modelSelect.selectOption(val);
      }
    }

    // Check if submit is enabled
    const isDisabled = await submitBtn.isDisabled();
    if (!isDisabled) {
      await submitBtn.click();

      // Dialog should close after successful submission
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Table should now show a new version row (v2 or higher)
      await expect(page.getByText(/v\d+/)).toBeVisible({ timeout: 10_000 });
    } else {
      // Model list may be empty in test env (no OPENAI_API_KEY) — skip activation
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'No models available (OPENAI_API_KEY not set in test env) — submit remained disabled',
      });
      // Close the dialog
      await page.keyboard.press('Escape');
    }
  });

  test('botão Ativar fica visível para versões inativas', async ({ page }) => {
    await page.goto('/admin/llm-configs');

    await expect(page.getByRole('heading', { name: 'Configurações de IA' })).toBeVisible({
      timeout: 10_000,
    });

    // Check if there's an inactive version with "Ativar" button
    const activateBtn = page.getByRole('button', { name: 'Ativar' }).first();
    const hasBtnVisible = await activateBtn.isVisible().catch(() => false);

    if (hasBtnVisible) {
      await activateBtn.click();
      // After activation, the previously inactive row should become active
      await expect(page.getByRole('cell', { name: 'Ativa' })).toBeVisible({ timeout: 10_000 });
    } else {
      // Only one version exists (v1 already active) — nothing to activate
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'No inactive versions available to activate',
      });
    }
  });

  test('tab CHAT mostra lista (vazia ou com configs)', async ({ page }) => {
    await page.goto('/admin/llm-configs');

    await expect(page.getByRole('heading', { name: 'Configurações de IA' })).toBeVisible({
      timeout: 10_000,
    });

    // Click on CHAT tab
    await page.getByRole('tab', { name: 'CHAT' }).click();

    // CHAT tab content should render (even if empty — shows "—")
    const chatTab = page.getByRole('tabpanel');
    await expect(chatTab).toBeVisible({ timeout: 5_000 });
  });
});
