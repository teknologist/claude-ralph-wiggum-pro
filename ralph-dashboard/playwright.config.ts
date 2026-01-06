/// <reference types="monocart-coverage-reports" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    // Add monocart coverage reporter
    [
      'monocart-coverage-reports',
      {
        outputFolder: 'coverage/e2e',
        reports: [
          ['json', { file: 'coverage-final.json' }],
          ['lcov'],
          ['html'],
        ],
      },
    ],
  ],
  use: {
    baseURL: 'http://localhost:3847',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // In CI, use production server (assets already built), otherwise use dev server
    command: process.env.CI ? 'bun run start' : 'COVERAGE=true bun run dev',
    url: 'http://localhost:3847',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60000 : 30000, // Longer timeout for CI
  },
});
