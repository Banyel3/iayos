/**
 * Setup after environment - runs before each test file
 * Note: Detox provides global 'device' object via its Jest environment
 * Do NOT import or require detox here - it's handled by the environment
 */
beforeAll(async () => {
  // The 'device' global is provided by Detox's Jest environment
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      detoxPrintBusyIdleResources: "YES",
    },
  });
}, 120000);
