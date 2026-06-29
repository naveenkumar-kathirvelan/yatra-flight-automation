import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["allure-playwright", { resultsDir: "allure-results" }],
    ["line"],
  ],
  use: {
    baseURL: process.env.BASE_URL || "https://www.yatra.com",
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    launchOptions: {
      args: ["--disable-http2"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
    // {
    //   name: "mobile-chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
  ],
  outputDir: "test-results",
});
