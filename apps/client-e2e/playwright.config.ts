import { defineConfig, devices } from '@playwright/test';

const CLIENT_URL = 'http://localhost:4200';
const SERVER_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: './src',
  outputDir: '../../dist/.playwright/client-e2e/results',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: {
    baseURL: CLIENT_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // a running `pnpm start` is reused locally; CI starts both apps
  webServer: [
    {
      command: 'pnpm nx run server:serve',
      env: { KITCHEN_TIME_SCALE: '0.02' },
      url: `${SERVER_URL}/api/v1/menu`,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
    {
      command: 'pnpm nx run client:serve --excludeTaskDependencies',
      url: CLIENT_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
