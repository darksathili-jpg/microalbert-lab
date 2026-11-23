import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.ts',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    timeout: 90000,
  },
})
