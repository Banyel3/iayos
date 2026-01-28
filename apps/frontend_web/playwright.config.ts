import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * This config runs end-to-end tests against the full application stack.
 * Tests verify critical user flows like authentication, job posting, and payments.
 */

export default defineConfig({
  testDir: "./e2e",

  // Test timeout (30 seconds per test)
  timeout: 30000,

  // Global timeout for entire test run (1 hour)
  globalTimeout: 60 * 60 * 1000,

  // Expect timeout for assertions (10 seconds)
  expect: {
    timeout: 10000,
  },

  // Fail fast in CI, continue locally
  fullyParallel: !process.env.CI,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // API endpoint
    extraHTTPHeaders: {
      "X-Test-Mode": "true",
    },

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Trace on first retry
    trace: "on-first-retry",

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors in test
    ignoreHTTPSErrors: true,

    // Action timeout
    actionTimeout: 15000,
  },

  // Test projects for different browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // Uncomment for Safari testing
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  // Run local dev server before tests (optional)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
