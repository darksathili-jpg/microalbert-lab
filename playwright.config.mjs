import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.mjs",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:8780/microalbert-lab/" },
  webServer: {
    command: "node tests/servir-pages.mjs",
    url: "http://127.0.0.1:8780/microalbert-lab/",
    timeout: 10_000
  }
});
