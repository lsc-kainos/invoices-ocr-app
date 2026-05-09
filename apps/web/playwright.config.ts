import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  webServer: {
    // Carrega .env.local diretamente (Next.js + Turbopack pode não seguir
    // symlinks do .env.local pra apps/web em todos os setups, então é mais
    // seguro injetar via shell). E2E_TEST=1 ativa o CredentialsProvider
    // de testes (NODE_ENV não funciona porque `next dev` força development).
    command: 'set -a; . ../../.env.local; set +a; E2E_TEST=1 NODE_ENV=development npm run dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
