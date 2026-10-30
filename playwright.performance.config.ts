import { defineConfig, devices } from "@playwright/test";

// Opt-in E11 lab suite: the production build must already exist (npm run build).
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "web-performance.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    reducedMotion: "reduce",
    ...(process.env.UI_CONTRACT_STUDIO_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.UI_CONTRACT_STUDIO_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
