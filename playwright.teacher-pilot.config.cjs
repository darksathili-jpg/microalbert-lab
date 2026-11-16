const { defineConfig } = require('@playwright/test');
const standard = require('./playwright.config.cjs');

module.exports = defineConfig({
  ...standard,
  testMatch: 'g4-teacher-pilot-integration.spec.cjs',
  timeout: 45000,
  use: { ...standard.use, trace: 'off' },
  workers: 1,
  webServer: {
    command: 'npm --prefix frontend run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173/',
    timeout: 120000,
  },
});
