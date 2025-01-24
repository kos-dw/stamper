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
    // headless: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: 'npx serve ./e2e/mock -l 3000',
    url: 'http://localhost:3000',
    timeout: 10 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
