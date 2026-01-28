/**
 * Global teardown - runs once after all tests
 */
export default async function globalTeardown() {
  console.log("");
  console.log("🏁 Detox E2E Test Suite Complete");
  console.log("📊 Check e2e/reports/test-report.html for detailed results");
}
