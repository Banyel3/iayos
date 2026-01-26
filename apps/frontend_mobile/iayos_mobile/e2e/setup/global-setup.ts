/**
 * Global setup - runs once before all tests
 * Note: Detox 'device' is only available during test runtime, not in globalSetup
 * Note: This health check runs on the HOST machine, not inside the Android emulator
 */
export default async function globalSetup() {
  console.log("🚀 Starting Detox E2E Test Suite...");
  console.log("📱 Target: iOS Simulator / Android Emulator");
  console.log("🌐 Backend: Staging environment");
  console.log("");

  // Wait for staging backend to be ready
  // Note: We check localhost:8000 from the host machine
  // The Android emulator will access this via ADB reverse port forwarding
  const backendUrl =
    process.env.STAGING_BACKEND_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://localhost:8000";
  
  // Normalize URL for host-side check (10.0.2.2 → localhost)
  const hostCheckUrl = backendUrl.replace("10.0.2.2", "localhost");
  console.log(`🔌 Checking backend from host: ${hostCheckUrl}`);
  console.log(`📱 App will access backend via: ${backendUrl}`);
  console.log(`🔀 ADB reverse tcp:8000 should be active for emulator access`);

  try {
    // Add 10-second timeout to fail fast instead of hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${hostCheckUrl}/health/live`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("✅ Backend health check passed (from host)");
    } else {
      console.warn("⚠️ Backend health check returned:", response.status);
      console.warn("⚠️ Tests may fail if backend is not properly running");
      // Don't exit - let tests attempt to run so we get better diagnostics
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠️ Could not reach backend:", errorMessage);
    console.warn("⚠️ This check runs on host - emulator uses ADB reverse");
    console.warn("⚠️ If ADB reverse is configured, tests may still work");
    // Don't exit - let tests attempt to run
    // The AuthContext now has a 10-second timeout so app won't hang forever
  }

  console.log("");
}
