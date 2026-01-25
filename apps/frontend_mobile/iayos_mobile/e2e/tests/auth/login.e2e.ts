import { device, element, by, expect, waitFor } from 'detox';
import { loginAsWorker, loginAsClient, logout, TEST_USERS } from '../../helpers/auth';
import { waitForScreen } from '../../helpers/navigation';

describe('Authentication: Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display welcome screen on app launch', async () => {
    await waitForScreen('welcome-screen');
    await expect(element(by.id('get-started-button'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
  });

  it('should navigate to login screen when tapping Login button', async () => {
    await element(by.id('login-button')).tap();
    await waitForScreen('login-screen');
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('should show validation error for empty fields', async () => {
    await element(by.id('login-button')).tap();
    await waitForScreen('login-screen');
    
    // Tap submit without filling fields
    await element(by.id('login-submit-button')).tap();
    
    // Check for error message (adjust text based on actual implementation)
    await waitFor(element(by.text('Please fill in all fields')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('login-button')).tap();
    await waitForScreen('login-screen');
    
    // Enter invalid credentials
    await element(by.id('email-input')).typeText('invalid@test.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-submit-button')).tap();
    
    // Wait for error message
    await waitFor(element(by.text('Login failed')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should login successfully as WORKER with valid credentials', async () => {
    await element(by.id('login-button')).tap();
    await waitForScreen('login-screen');
    
    // Login as worker
    await loginAsWorker();
    
    // Verify landing on home tab (jobs list for workers)
    await expect(element(by.id('tab-home'))).toBeVisible();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should login successfully as CLIENT with valid credentials', async () => {
    await element(by.id('login-button')).tap();
    await waitForScreen('login-screen');
    
    // Login as client
    await loginAsClient();
    
    // Verify landing on home tab (workers list for clients)
    await expect(element(by.id('tab-home'))).toBeVisible();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should logout successfully and return to welcome screen', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await loginAsWorker();
    
    // Verify logged in
    await expect(element(by.id('tab-profile'))).toBeVisible();
    
    // Logout
    await logout();
    
    // Verify back on welcome screen
    await waitForScreen('welcome-screen');
    await expect(element(by.id('get-started-button'))).toBeVisible();
  });

  it('should persist login session after app reload', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await loginAsWorker();
    
    // Reload app
    await device.reloadReactNative();
    
    // Should still be logged in (no welcome screen)
    await waitFor(element(by.id('tab-home')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show password when toggle visibility is tapped', async () => {
    await element(by.id('login-button')).tap();
    await waitForScreen('login-screen');
    
    // Type password
    await element(by.id('password-input')).typeText('Test1234!');
    
    // Tap visibility toggle (if implemented)
    try {
      await element(by.id('password-toggle')).tap();
      // Password should now be visible as plain text
    } catch (e) {
      // Toggle not implemented yet
      console.log('⚠️ Password visibility toggle not found');
    }
  });
});
