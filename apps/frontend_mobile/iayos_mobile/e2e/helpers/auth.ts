import { device, element, by, waitFor } from 'detox';

/**
 * Test user credentials for staging backend
 */
export const TEST_USERS = {
  worker: {
    email: 'worker.test@iayos.com',
    password: 'Test1234!',
    role: 'WORKER'
  },
  client: {
    email: 'client.test@iayos.com',
    password: 'Test1234!',
    role: 'CLIENT'
  },
  agency: {
    email: 'agency.test@iayos.com',
    password: 'Test1234!',
    role: 'AGENCY'
  }
};

/**
 * Login as WORKER user
 */
export async function loginAsWorker() {
  await loginWithCredentials(TEST_USERS.worker.email, TEST_USERS.worker.password);
  await waitFor(element(by.id('tab-home')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Login as CLIENT user
 */
export async function loginAsClient() {
  await loginWithCredentials(TEST_USERS.client.email, TEST_USERS.client.password);
  await waitFor(element(by.id('tab-home')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Login as AGENCY user
 */
export async function loginAsAgency() {
  await loginWithCredentials(TEST_USERS.agency.email, TEST_USERS.agency.password);
  await waitFor(element(by.id('tab-home')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Generic login with email and password
 */
export async function loginWithCredentials(email: string, password: string) {
  // Navigate to login from welcome
  await waitFor(element(by.id('login-button')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('login-button')).tap();
  
  // Wait for login screen
  await waitFor(element(by.id('login-screen')))
    .toBeVisible()
    .withTimeout(3000);
  
  // Fill credentials
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  
  // Submit
  await element(by.id('login-submit-button')).tap();
}

/**
 * Logout from app
 */
export async function logout() {
  // Navigate to profile tab
  await element(by.id('tab-profile')).tap();
  await waitFor(element(by.id('profile-screen')))
    .toBeVisible()
    .withTimeout(3000);
  
  // Tap logout button
  await element(by.id('logout-button')).tap();
  
  // Confirm logout if modal appears
  try {
    await waitFor(element(by.id('logout-confirm-button')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('logout-confirm-button')).tap();
  } catch (e) {
    // No confirmation modal
  }
  
  // Wait for welcome screen
  await waitFor(element(by.id('welcome-screen')))
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
  await waitFor(element(by.id('get-started-button')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('get-started-button')).tap();
  
  // Wait for register screen
  await waitFor(element(by.id('register-screen')))
    .toBeVisible()
    .withTimeout(3000);
  
  // Fill registration form
  await element(by.id('firstName-input')).typeText(userData.firstName);
  await element(by.id('lastName-input')).typeText(userData.lastName);
  await element(by.id('email-input')).typeText(userData.email);
  await element(by.id('phone-input')).typeText(userData.phone);
  await element(by.id('birthDate-input')).typeText(userData.birthDate);
  await element(by.id('address-input')).typeText(userData.address);
  await element(by.id('password-input')).typeText(userData.password);
  await element(by.id('confirmPassword-input')).typeText(userData.password);
  
  // Submit registration
  await element(by.id('register-submit-button')).tap();
  
  // Wait for OTP screen
  await waitFor(element(by.id('verify-otp-screen')))
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
    delete: true
  });
}
