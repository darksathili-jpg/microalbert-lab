const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  retries: 0,
  reporter: [['list'], ['html',{open:'never',outputFolder:'playwright-report'}]],
  use: { browserName: 'chromium', headless: true, trace: 'retain-on-failure' },
});
