import { device, element, by, waitFor } from "detox";

/**
 * Test user credentials for staging backend
 * NOTE: These users must exist in the staging database
 */
export const TEST_USERS = {
  worker: {
    email: "worker.test@iayos.com",
    password: "Test1234!",
    role: "WORKER",
  },
  client: {
    email: "client.test@iayos.com",
    password: "Test1234!",
    role: "CLIENT",
  },
  agency: {
    email: "agency.test@iayos.com",
    password: "Test1234!",
    role: "AGENCY",
  },
};

/**
 * Login as WORKER user
 */
export async function loginAsWorker() {
  await loginWithCredentials(
    TEST_USERS.worker.email,
    TEST_USERS.worker.password,
  );
}

/**
 * Login as CLIENT user
 */
export async function loginAsClient() {
  await loginWithCredentials(
    TEST_USERS.client.email,
    TEST_USERS.client.password,
  );
}

/**
 * Login as AGENCY user
 */
export async function loginAsAgency() {
  await loginWithCredentials(
    TEST_USERS.agency.email,
    TEST_USERS.agency.password,
  );
}

/**
 * Generic login with email and password
 * Does NOT navigate to login - assumes already on login screen
 */
export async function loginWithCredentials(email: string, password: string) {
  // Wait for login screen inputs
  await waitFor(element(by.id("login-email-input")))
    .toBeVisible()
    .withTimeout(3000);

  // Fill credentials
  await element(by.id("login-email-input")).clearText();
  await element(by.id("login-email-input")).typeText(email);
  await element(by.id("login-password-input")).clearText();
  await element(by.id("login-password-input")).typeText(password);

  // Submit
  await element(by.id("login-submit-button")).tap();

  // Wait for navigation away from login screen
  await waitFor(element(by.id("login-screen")))
    .not.toBeVisible()
    .withTimeout(10000);
}

/**
 * Logout from app
 */
export async function logout() {
  // Navigate to profile tab
  try {
    await element(by.id("tab-profile")).tap();
  } catch (e) {
    // If no tab bar, try scrolling to find profile
    console.log("⚠️ Tab bar not found, looking for profile button");
  }

  await waitFor(element(by.id("profile-logout-button")))
    .toBeVisible()
    .withTimeout(5000);

  // Tap logout button
  await element(by.id("profile-logout-button")).tap();

  // Handle confirmation alert
  try {
    await waitFor(element(by.text("Logout")))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text("Logout")).atIndex(1).tap(); // Second "Logout" is confirm button
  } catch (e) {
    console.log("⚠️ No logout confirmation modal");
  }

  // Wait for welcome screen
  await waitFor(element(by.id("welcome-screen")))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Register new user (for testing registration flow)
 */
export async function registerUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  address: string;
}) {
  // Navigate to register from welcome
  await waitFor(element(by.id("welcome-get-started-button")))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id("welcome-get-started-button")).tap();

  // Wait for register screen
  await waitFor(element(by.id("register-screen")))
    .toBeVisible()
    .withTimeout(3000);

  // Fill registration form
  await element(by.id("register-first-name-input")).typeText(
    userData.firstName,
  );
  await element(by.id("register-last-name-input")).typeText(userData.lastName);
  await element(by.id("register-email-input")).typeText(userData.email);
  await element(by.id("register-phone-input")).typeText(userData.phone);
  await element(by.id("register-birthdate-input")).typeText(userData.birthDate);
  await element(by.id("register-address-input")).typeText(userData.address);
  await element(by.id("register-password-input")).typeText(userData.password);
  await element(by.id("register-confirm-password-input")).typeText(
    userData.password,
  );

  // Submit registration
  await element(by.id("register-submit-button")).tap();

  // Wait for OTP screen
  await waitFor(element(by.id("verify-otp-screen")))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Clear app data and restart
 */
export async function resetApp() {
  await device.clearKeychain();
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
}
