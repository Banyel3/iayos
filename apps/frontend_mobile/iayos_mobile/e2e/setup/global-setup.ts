/**
 * Global setup - runs once before all tests
 * Note: Detox 'device' is only available during test runtime, not in globalSetup
 */
export default async function globalSetup() {
  console.log("🚀 Starting Detox E2E Test Suite...");
  console.log("📱 Target: iOS Simulator / Android Emulator");
  console.log("🌐 Backend: Staging environment");
  console.log("");

  // Wait for staging backend to be ready (REQUIRED - fail fast if unavailable)
  const backendUrl = process.env.STAGING_BACKEND_URL || "http://localhost:8000";
  console.log(`🔌 Connecting to staging backend: ${backendUrl}`);

  try {
    // Add 5-second timeout to fail fast instead of hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${backendUrl}/health/live`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("✅ Staging backend is ready");
    } else {
      console.error("❌ Staging backend health check failed:", response.status);
      console.error("❌ Tests cannot proceed without backend");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Could not reach staging backend:", error.message);
    console.error("❌ Tests cannot proceed without backend");
    console.error(`❌ Ensure STAGING_BACKEND_URL is set correctly: ${backendUrl}`);
    process.exit(1);
  }

  console.log("");
}
