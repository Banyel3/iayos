import { device } from "detox";

/**
 * Mock image picker (camera/gallery)
 * Uses Detox native module mocking
 */
export async function mockImagePicker(mockImagePath?: string) {
  const imagePath = mockImagePath || "e2e/fixtures/images/test-image.jpg";

  // Mock expo-image-picker native module
  await device.setURLBlacklist([]);

  // Return mock image response
  const mockResponse = {
    assets: [
      {
        uri: `file:///${imagePath}`,
        fileName: "test-image.jpg",
        type: "image/jpeg",
        fileSize: 1024 * 500, // 500KB
        width: 1200,
        height: 1200,
      },
    ],
    canceled: false,
  };

  return mockResponse;
}

/**
 * Mock camera permissions
 */
export async function mockCameraPermissions(granted: boolean = true) {
  await device.setPermissions(
    {
      camera: granted ? "granted" : "denied",
      photos: granted ? "granted" : "denied",
    },
    "com.iayos.mobile",
  );
}

/**
 * Mock location permissions
 */
export async function mockLocationPermissions(granted: boolean = true) {
  await device.setPermissions(
    {
      location: granted ? "always" : "denied",
    },
    "com.iayos.mobile",
  );
}

/**
 * Mock push notification permissions
 */
export async function mockNotificationPermissions(granted: boolean = true) {
  await device.setPermissions(
    {
      notifications: granted ? "granted" : "denied",
    },
    "com.iayos.mobile",
  );
}

/**
 * Mock successful payment callback
 */
export async function mockPaymentSuccess(jobId: number) {
  // Simulate Xendit payment callback
  // In real tests, staging backend will handle this
  console.log(`✅ Mocked payment success for job ${jobId}`);
}

/**
 * Mock failed payment callback
 */
export async function mockPaymentFailure(
  jobId: number,
  reason: string = "Insufficient funds",
) {
  console.log(`❌ Mocked payment failure for job ${jobId}: ${reason}`);
}

/**
 * Mock OTP code for testing
 * Note: In staging, use a known test OTP like '123456'
 */
export async function getMockOTPCode(): Promise<string> {
  return "123456";
}

/**
 * Set app to use staging backend
 */
export async function useStagingBackend() {
  const stagingUrl = process.env.STAGING_BACKEND_URL || "http://localhost:8000";

  await device.setURLBlacklist([]);

  // Override API base URL via launchArgs
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      detoxURLBlacklistRegex: ".*",
      API_URL: stagingUrl,
    },
  });
}

/**
 * Reset backend test data
 * Calls staging backend cleanup endpoint
 */
export async function resetStagingData() {
  const stagingUrl = process.env.STAGING_BACKEND_URL || "http://localhost:8000";

  try {
    await fetch(`${stagingUrl}/api/test/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Staging data reset");
  } catch (error) {
    console.warn("⚠️ Could not reset staging data:", error.message);
  }
}
