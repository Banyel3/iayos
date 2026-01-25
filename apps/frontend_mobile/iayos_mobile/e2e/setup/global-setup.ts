import { device } from "detox";

/**
 * Global setup - runs once before all tests
 */
export default async function globalSetup() {
  console.log("🚀 Starting Detox E2E Test Suite...");
  console.log("📱 Target: iOS Simulator / Android Emulator");
  console.log("🌐 Backend: Staging environment");
  console.log("");

  // Wait for staging backend to be ready (optional)
  const backendUrl = process.env.STAGING_BACKEND_URL || "http://localhost:8000";
  console.log(`🔌 Connecting to staging backend: ${backendUrl}`);

  try {
    const response = await fetch(`${backendUrl}/health/live`);
    if (response.ok) {
      console.log("✅ Staging backend is ready");
    } else {
      console.warn("⚠️ Staging backend health check failed, tests may fail");
    }
  } catch (error) {
    console.warn("⚠️ Could not reach staging backend:", error.message);
    console.warn("⚠️ Tests will likely fail without backend");
  }

  console.log("");
}
