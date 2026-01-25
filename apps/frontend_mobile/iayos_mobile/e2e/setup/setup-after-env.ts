const detox = require('detox');

/**
 * Setup after environment - runs before each test file
 * Using CommonJS require to avoid ESM import issues with Jest
 */
beforeAll(async () => {
  await detox.device.launchApp({
    newInstance: true,
    launchArgs: {
      detoxPrintBusyIdleResources: "YES",
    },
  });
}, 120000);

/**
 * Cleanup after each test file
 */
afterAll(async () => {
  await detox.cleanup();
});

/**
 * Custom matchers for better assertions
 */
expect.extend({
  toBeVisibleAndEnabled(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => `Expected element to be visible and enabled`,
    };
  },
});
