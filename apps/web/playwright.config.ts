import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for FACILIA E2E tests.
 *
 * The app runs under basePath /facilia (ADR-004).
 * Tests use relative paths — baseURL includes the prefix.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // sequential — tests share DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // single worker — shared Supabase state
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't auto-start the web server — we use the Docker compose stack
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000/facilia',
  //   reuseExistingServer: true,
  // },
})
