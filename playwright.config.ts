import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: 'npx serve -s tests/mock -l 3000',
    url: 'http://localhost:3000',
    timeout: 30 * 1000, // 30秒で起動しなければ失敗
    reuseExistingServer: !process.env.CI, // ローカルではサーバーを再利用
  },
});
