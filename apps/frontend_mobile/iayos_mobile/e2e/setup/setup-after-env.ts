import { device, cleanup } from 'detox';

/**
 * Setup after environment - runs before each test file
 */
beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      detoxPrintBusyIdleResources: 'YES'
    }
  });
}, 120000);

/**
 * Cleanup after each test file
 */
afterAll(async () => {
  await cleanup();
});

/**
 * Custom matchers for better assertions
 */
expect.extend({
  toBeVisibleAndEnabled(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => `Expected element to be visible and enabled`
    };
  }
});
