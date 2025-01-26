import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run serve",
    url: "http://localhost:3000",
    timeout: 10 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
