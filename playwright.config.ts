import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          // Los E2E crean varios enlaces seguidos desde la misma IP; desactivamos
          // el rate limit para que los tests evalúen el flujo, no el limitador.
          RATE_LIMIT_DISABLED: 'true',
          // Evita el warning de NextAuth sobre NEXTAUTH_URL en los tests.
          NEXTAUTH_URL: baseURL,
          NEXTAUTH_SECRET: 'e2e-secret-not-used-in-production',
        },
      },
});
