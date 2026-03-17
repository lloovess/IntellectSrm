import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'E2E_BYPASS_AUTH=1 HOSTNAME=127.0.0.1 PORT=4175 npm run dev',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
