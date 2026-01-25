module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.e2e.ts"],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: "<rootDir>/e2e/setup/global-setup.ts",
  globalTeardown: "<rootDir>/e2e/setup/global-teardown.ts",
  setupFilesAfterEnv: ["<rootDir>/e2e/setup/setup-after-env.ts"],
  reporters: [
    "default",
    "detox/runners/jest/reporter",
    [
      "jest-html-reporters",
      {
        publicPath: "./e2e/reports",
        filename: "test-report.html",
        pageTitle: "iAyos E2E Test Report",
        expand: true,
        openReport: false,
        includeConsoleLog: true,
        includeFailureMsg: true,
      },
    ],
  ],
  verbose: true,
  bail: false, // Continue on failure
  collectCoverage: false,
  testEnvironmentOptions: {
    url: "http://localhost",
  },
};
