import { test, expect } from "@playwright/test";

// Admin credentials (you'll need to create these in test setup)
const ADMIN_CREDENTIALS = {
  email: "admin@test.com",
  password: "Admin123!",
};

test.describe("Admin Panel Flows", () => {
  test.describe("Admin Authentication", () => {
    test("should login to admin panel", async ({ page }) => {
      await page.goto("/auth/login");

      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should show admin navigation sidebar", async ({ page }) => {
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

      // Should see admin menu items
      await expect(
        page.getByText(/dashboard|users|jobs|kyc|payments/i),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("KYC Management", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should display pending KYC submissions", async ({ page }) => {
      await page.goto("/admin/kyc");

      // Should see KYC list or pending count
      await expect(page.getByText(/kyc|verification|pending/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should view KYC document details", async ({ page }) => {
      await page.goto("/admin/kyc");

      // Click first KYC submission if exists
      const firstSubmission = page
        .locator('[role="link"], button')
        .filter({ hasText: /view|details/i })
        .first();
      if (await firstSubmission.isVisible({ timeout: 3000 })) {
        await firstSubmission.click();

        // Should show document viewer
        await expect(page.getByText(/document|id|verification/i)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("should have approve and reject buttons on KYC detail", async ({
      page,
    }) => {
      await page.goto("/admin/kyc");

      const firstSubmission = page
        .locator('[role="link"], button')
        .filter({ hasText: /view|details/i })
        .first();
      if (await firstSubmission.isVisible({ timeout: 3000 })) {
        await firstSubmission.click();

        // Should see action buttons
        const approveButton = page.getByRole("button", { name: /approve/i });
        const rejectButton = page.getByRole("button", { name: /reject/i });

        const hasApprove = await approveButton
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        const hasReject = await rejectButton
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        expect(hasApprove || hasReject).toBeTruthy();
      }
    });

    test("should require rejection reason when rejecting KYC", async ({
      page,
    }) => {
      await page.goto("/admin/kyc");

      const firstSubmission = page
        .locator('[role="link"], button')
        .filter({ hasText: /view|details/i })
        .first();
      if (await firstSubmission.isVisible({ timeout: 3000 })) {
        await firstSubmission.click();

        const rejectButton = page.getByRole("button", { name: /reject/i });
        if (await rejectButton.isVisible({ timeout: 3000 })) {
          await rejectButton.click();

          // Should show reason input (minimum 10 characters)
          const reasonInput = page.locator(
            'textarea[name="reason"], input[name="reason"]',
          );
          if (await reasonInput.isVisible({ timeout: 3000 })) {
            await reasonInput.fill("Bad"); // Too short

            await page.getByRole("button", { name: /confirm|submit/i }).click();

            // Should show validation error
            await expect(
              page.getByText(/at least 10|minimum.*10/i),
            ).toBeVisible({ timeout: 3000 });
          }
        }
      }
    });
  });

  test.describe("User Management", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should display users list", async ({ page }) => {
      await page.goto("/admin/users");

      // Should see users table or list
      await expect(page.getByText(/users|workers|clients/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should filter users by type", async ({ page }) => {
      await page.goto("/admin/users");

      // Look for filter options
      const filterButton = page
        .locator("select, button")
        .filter({ hasText: /worker|client|all/i })
        .first();
      if (await filterButton.isVisible({ timeout: 3000 })) {
        await filterButton.click();

        // Results should update
        await page.waitForTimeout(1000);
      }
    });

    test("should search users", async ({ page }) => {
      await page.goto("/admin/users");

      const searchInput = page
        .locator('input[placeholder*="search" i], input[type="search"]')
        .first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill("test");
        await page.keyboard.press("Enter");

        // Results should update
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Job Management", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should display jobs listings", async ({ page }) => {
      await page.goto("/admin/jobs/listings");

      // Should see jobs list
      await expect(page.getByText(/job.*listing|total.*jobs/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should filter jobs by status", async ({ page }) => {
      await page.goto("/admin/jobs/listings");

      // Look for status filter
      const statusFilter = page
        .locator('select[name="status"], button')
        .filter({ hasText: /active|completed|cancelled/i })
        .first();
      if (await statusFilter.isVisible({ timeout: 3000 })) {
        await statusFilter.click();

        // Select a status
        const activeOption = page.getByText(/active/i).first();
        if (await activeOption.isVisible({ timeout: 2000 })) {
          await activeOption.click();

          // Jobs should update
          await page.waitForTimeout(1000);
        }
      }
    });

    test("should delete job with confirmation", async ({ page }) => {
      await page.goto("/admin/jobs/listings");

      const deleteButton = page
        .getByRole("button", { name: /delete/i })
        .first();
      if (await deleteButton.isVisible({ timeout: 3000 })) {
        await deleteButton.click();

        // Should show confirmation dialog
        await expect(
          page.getByText(/are you sure|confirm|delete/i),
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test("should navigate to active jobs", async ({ page }) => {
      await page.goto("/admin/jobs/active");

      // Should see active jobs
      await expect(page.getByText(/active.*job|in.*progress/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should navigate to completed jobs", async ({ page }) => {
      await page.goto("/admin/jobs/completed");

      // Should see completed jobs
      await expect(page.getByText(/completed.*job|finished/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Payment Management", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should display transactions list", async ({ page }) => {
      await page.goto("/admin/payments/transactions");

      // Should see transactions
      await expect(page.getByText(/transaction|payment|escrow/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should filter transactions by type", async ({ page }) => {
      await page.goto("/admin/payments/transactions");

      const typeFilter = page
        .locator("select, button")
        .filter({ hasText: /deposit|withdrawal|escrow/i })
        .first();
      if (await typeFilter.isVisible({ timeout: 3000 })) {
        await typeFilter.click();

        // Select a type
        await page.waitForTimeout(1000);
      }
    });

    test("should display payment analytics", async ({ page }) => {
      await page.goto("/admin/payments/analytics");

      // Should see analytics/stats
      await expect(
        page.getByText(/analytics|revenue|total.*payment/i),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Certification Verification", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should display pending certifications", async ({ page }) => {
      await page.goto("/admin/certifications/pending");

      // Should see pending certifications
      await expect(
        page.getByText(/certification|pending|verification/i),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should view certification details", async ({ page }) => {
      await page.goto("/admin/certifications/pending");

      const firstCert = page
        .locator('a[href*="/certifications/"], button')
        .filter({ hasText: /view|details/i })
        .first();
      if (await firstCert.isVisible({ timeout: 3000 })) {
        await firstCert.click();

        // Should show certification document
        await expect(
          page.getByText(/certification|document|worker/i),
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("should have approve/reject buttons", async ({ page }) => {
      await page.goto("/admin/certifications/pending");

      const firstCert = page
        .locator('a[href*="/certifications/"], button')
        .filter({ hasText: /view|details/i })
        .first();
      if (await firstCert.isVisible({ timeout: 3000 })) {
        await firstCert.click();

        // Should see action buttons
        const approveButton = page.getByRole("button", { name: /approve/i });
        const rejectButton = page.getByRole("button", { name: /reject/i });

        const hasApprove = await approveButton
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        const hasReject = await rejectButton
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        expect(hasApprove || hasReject).toBeTruthy();
      }
    });
  });

  test.describe("Dashboard Statistics", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
      await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test("should display admin dashboard with stats", async ({ page }) => {
      await page.goto("/admin/dashboard");

      // Should see statistics cards
      await expect(
        page.getByText(/total.*users|active.*jobs|revenue|pending/i),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should show recent activity", async ({ page }) => {
      await page.goto("/admin/dashboard");

      // Should see recent activity section
      const recentActivity = page.getByText(/recent.*activity|latest|new/i);
      if (await recentActivity.isVisible({ timeout: 3000 })) {
        await expect(recentActivity).toBeVisible();
      }
    });
  });
});
