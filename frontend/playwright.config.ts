import { defineConfig, devices } from "@playwright/test";

const apiServerCommand =
  process.platform === "win32"
    ? "powershell -NoProfile -ExecutionPolicy Bypass -File ../scripts/e2e-api.ps1"
    : "bash ../scripts/e2e-api.sh";

const e2eApiEnv = {
  SECRET_KEY:
    process.env.SECRET_KEY ?? "test-secret-key-for-e2e-local-only-not-production",
  INITIAL_ADMIN_PASSWORD:
    process.env.INITIAL_ADMIN_PASSWORD ?? "change-me-local-only",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: apiServerCommand,
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: e2eApiEnv,
    },
    {
      command: "npm run dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
