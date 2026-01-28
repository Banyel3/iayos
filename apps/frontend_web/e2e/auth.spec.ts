import { test, expect } from "@playwright/test";

// Test credentials
const TEST_CREDENTIALS = {
  client: {
    email: "client@test.com",
    password: "Test123!",
  },
  worker: {
    email: "worker@test.com",
    password: "Test123!",
  },
  new: {
    email: `testuser${Date.now()}@test.com`,
    password: "Test123!@#",
    firstName: "Test",
    lastName: "User",
    country: "Philippines",
  },
};

/**
 * Authentication E2E Tests
 *
 * Tests critical authentication flows:
 * - Login (client and worker)
 * - Registration
 * - Logout
 * - Password validation
 * - Email verification flow
 */

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto("/");
  });

  test.describe("Login Flow", () => {
    test("should display login page with all elements", async ({ page }) => {
      await page.goto("/auth/login");

      // Check for required elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign in|login/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/don't have an account|sign up/i),
      ).toBeVisible();
    });

    test("should successfully login as client", async ({ page }) => {
      await page.goto("/auth/login");

      await page.fill('input[name="email"]', TEST_CREDENTIALS.client.email);
      await page.fill(
        'input[type="password"]',
        TEST_CREDENTIALS.client.password,
      );
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Should see user profile elements
      await expect(page.getByText(/dashboard|home/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should successfully login as worker", async ({ page }) => {
      await page.goto("/auth/login");

      await page.fill('input[name="email"]', TEST_CREDENTIALS.worker.email);
      await page.fill(
        'input[type="password"]',
        TEST_CREDENTIALS.worker.password,
      );
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      await expect(page.getByText(/dashboard|home/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/auth/login");

      await page.fill('input[name="email"]', "invalid@test.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Should show error message
      await expect(
        page.getByText(/invalid credentials|incorrect email or password/i),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/auth/login");

      await page.fill('input[name="email"]', "notanemail");
      await page.fill('input[type="password"]', "Test123!");

      // Try to submit
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Should show email validation error
      await expect(page.getByText(/valid email|email address/i)).toBeVisible();
    });

    test("should toggle password visibility", async ({ page }) => {
      await page.goto("/auth/login");

      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();

      // Click show password button
      await page
        .locator(
          'button[aria-label*="password" i], svg.lucide-eye, svg.lucide-eye-off',
        )
        .first()
        .click();

      // Password should be visible (type="text")
      const visibleInput = page.locator('input[name="password"][type="text"]');
      await expect(visibleInput).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("Registration Flow", () => {
    test("should display registration page with all elements", async ({
      page,
    }) => {
      await page.goto("/auth/register");

      // Check for required form fields
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign up|create account|register/i }),
      ).toBeVisible();
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/auth/register");

      // Fill form with weak password
      await page.fill('input[name="email"]', TEST_CREDENTIALS.new.email);
      await page.fill(
        'input[name="firstName"]',
        TEST_CREDENTIALS.new.firstName,
      );
      await page.fill('input[name="lastName"]', TEST_CREDENTIALS.new.lastName);
      await page.fill('input[name="password"]', "weak");

      // Should show password strength error
      await page
        .getByRole("button", { name: /sign up|create account|register/i })
        .click();
      await expect(
        page.getByText(/password must|at least 6 characters|strong password/i),
      ).toBeVisible();
    });

    test("should validate email format during registration", async ({
      page,
    }) => {
      await page.goto("/auth/register");

      await page.fill('input[name="email"]', "invalidemail");
      await page
        .getByRole("button", { name: /sign up|create account|register/i })
        .click();

      await expect(page.getByText(/valid email|email address/i)).toBeVisible();
    });

    test("should navigate to login page from register", async ({ page }) => {
      await page.goto("/auth/register");

      await page.getByText(/already have an account|sign in/i).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe("Session Management", () => {
    test("should persist session after page reload", async ({ page }) => {
      // Login first
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', TEST_CREDENTIALS.client.email);
      await page.fill(
        'input[type="password"]',
        TEST_CREDENTIALS.client.password,
      );
      await page.getByRole("button", { name: /sign in|login/i }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/dashboard|home/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should logout successfully", async ({ page }) => {
      // Login first
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', TEST_CREDENTIALS.client.email);
      await page.fill(
        'input[type="password"]',
        TEST_CREDENTIALS.client.password,
      );
      await page.getByRole("button", { name: /sign in|login/i }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Find and click logout button (could be in dropdown menu)
      await page.getByRole("button", { name: /logout|sign out/i }).click();

      // Should redirect to login or home page
      await expect(page).toHaveURL(/\/(auth\/login)?$/, { timeout: 5000 });
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users to login", async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    });

    test("should allow access to public pages without authentication", async ({
      page,
    }) => {
      // These pages should be accessible
      await page.goto("/");
      await expect(page).toHaveURL("/");

      await page.goto("/auth/login");
      await expect(page).toHaveURL("/auth/login");

      await page.goto("/auth/register");
      await expect(page).toHaveURL("/auth/register");
    });
  });
});

test.describe("Session Persistence", () => {
  test("should maintain session after page reload", async ({ page }) => {
    // Login
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "client@test.com");
    await page.fill('input[type="password"]', "Test123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
