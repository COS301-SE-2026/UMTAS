import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", // Point to your specific lighthouse tests directory
  timeout: 60 * 1000,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",

    trace: "on-first-retry",

    launchOptions: {
      args: ["--remote-debugging-port=9222"],
    },
  },
  projects: [
    {
      name: "Lighthouse",
      testMatch: /.*\.audit\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
