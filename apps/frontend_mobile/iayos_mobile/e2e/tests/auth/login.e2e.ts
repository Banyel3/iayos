import { device, element, by, expect, waitFor } from "detox";
import {
  loginAsWorker,
  loginAsClient,
  logout,
  TEST_USERS,
} from "../../helpers/auth";
import { waitForScreen } from "../../helpers/navigation";

// Timeout for app launch - Android emulator can take 2+ minutes to launch and connect
const APP_LAUNCH_TIMEOUT = 300000; // 5 minutes

describe("Authentication: Login Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  }, APP_LAUNCH_TIMEOUT);

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should display welcome screen on app launch", async () => {
    await waitForScreen("welcome-screen");
    await expect(element(by.id("welcome-get-started-button"))).toBeVisible();
    await expect(element(by.id("welcome-login-button"))).toBeVisible();
  });

  it("should navigate to login screen when tapping Login button", async () => {
    await element(by.id("welcome-login-button")).tap();
    await waitForScreen("login-screen");
    await expect(element(by.id("login-email-input"))).toBeVisible();
    await expect(element(by.id("login-password-input"))).toBeVisible();
    await expect(element(by.id("login-submit-button"))).toBeVisible();
  });

  it("should show validation error for empty fields", async () => {
    await element(by.id("welcome-login-button")).tap();
    await waitForScreen("login-screen");

    // Tap submit without filling fields
    await element(by.id("login-submit-button")).tap();

    // Check for error alert (adjust text based on actual implementation)
    await waitFor(element(by.text("Please fill in all fields")))
      .toBeVisible()
      .withTimeout(3000);
  });

  it("should show error for invalid credentials", async () => {
    await element(by.id("welcome-login-button")).tap();
    await waitForScreen("login-screen");

    // Enter invalid credentials
    await element(by.id("login-email-input")).typeText("invalid@test.com");
    await element(by.id("login-password-input")).typeText("wrongpassword");
    await element(by.id("login-submit-button")).tap();

    // Wait for error message (alert or inline)
    await waitFor(element(by.text(/login failed|invalid|error/i)))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should login successfully as WORKER with valid credentials", async () => {
    await element(by.id("welcome-login-button")).tap();
    await waitForScreen("login-screen");

    // Login as worker
    await loginAsWorker();

    // Verify landing on home/tabs (may redirect to role selection if no profile)
    await waitFor(
      element(by.id("jobs-screen"))
        .or(element(by.id("home-screen")))
        .or(element(by.id("select-role-screen"))),
    )
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should login successfully as CLIENT with valid credentials", async () => {
    await element(by.id("welcome-login-button")).tap();
    await waitForScreen("login-screen");

    // Login as client
    await loginAsClient();

    // Verify landing on home/tabs (may redirect to role selection if no profile)
    await waitFor(
      element(by.id("jobs-screen"))
        .or(element(by.id("home-screen")))
        .or(element(by.id("select-role-screen"))),
    )
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should logout successfully and return to welcome screen", async () => {
    // Login first
    await element(by.id("welcome-login-button")).tap();
    await loginAsWorker();

    // Wait for app to load after login
    await waitFor(element(by.id("profile-logout-button")))
      .toBeVisible()
      .withTimeout(10000);

    // Logout
    await logout();

    // Verify back on welcome screen
    await waitForScreen("welcome-screen");
    await expect(element(by.id("welcome-get-started-button"))).toBeVisible();
  });

  it("should persist login session after app reload", async () => {
    // Login first
    await element(by.id("welcome-login-button")).tap();
    await loginAsWorker();

    // Wait for home screen after login
    await waitFor(
      element(by.id("jobs-screen")).or(element(by.id("home-screen"))),
    )
      .toBeVisible()
      .withTimeout(10000);

    // Reload app
    await device.reloadReactNative();

    // Should still be logged in (not on welcome screen)
    await waitFor(
      element(by.id("jobs-screen")).or(element(by.id("home-screen"))),
    )
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should navigate to register screen from login", async () => {
    await element(by.id("welcome-login-button")).tap();
    await waitForScreen("login-screen");

    // Tap register link
    await element(by.id("login-register-link")).tap();

    // Verify on register screen
    await waitFor(element(by.id("register-screen")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
