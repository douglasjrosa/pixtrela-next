import { config as loadDotenv } from "dotenv";
import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadDotenv({ path: ".env.local" });
loadDotenv();
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Live Next create flows (template copy) are slow; keep load modest.
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
    reuseExistingServer: process.env.E2E_REUSE_DEV_SERVER === "1",
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "development",
      AUTH_URL: "http://localhost:3000",
    },
  },
});
