import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Live Next+Strapi create flows (template copy) are slow; keep load modest.
  workers: process.env.CI ? 1 : 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
