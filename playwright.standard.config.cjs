const { defineConfig } = require('@playwright/test');
const standard = require('./playwright.config.cjs');

module.exports = defineConfig({
  ...standard,
  testIgnore: [
    'g4-public-pages-runtime.spec.cjs',
    'g4-teacher-pilot-integration.spec.cjs',
    'g4-p6j-student-staging.spec.cjs',
    'g4-infra-01-python-themes.spec.cjs',
  ],
  workers: 2,
  webServer: [
    {
      command: 'python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/api/health',
      timeout: 30000,
    },
    {
      command: 'npm --prefix frontend run dev -- --port 5173 --strictPort',
      url: 'http://127.0.0.1:5173/',
      timeout: 120000,
    },
  ],
});
