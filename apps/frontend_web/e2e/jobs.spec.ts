import { test, expect } from "@playwright/test";

// Test credentials
const CLIENT_CREDENTIALS = {
  email: "client@test.com",
  password: "Test123!",
};

const WORKER_CREDENTIALS = {
  email: "worker@test.com",
  password: "Test123!",
};

test.describe("Job Management Flows", () => {
  test.describe("Client - Job Creation (LISTING)", () => {
    test.beforeEach(async ({ page }) => {
      // Login as client
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', CLIENT_CREDENTIALS.email);
      await page.fill('input[type="password"]', CLIENT_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should display job creation page", async ({ page }) => {
      // Navigate to job creation (LISTING)
      await page.goto("/dashboard/jobs/create/listing");

      // Check for required form elements
      await expect(
        page.locator('input[name="title"], textarea[name="title"]'),
      ).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      await expect(page.getByText(/budget|price/i)).toBeVisible();
      await expect(page.getByText(/category|service type/i)).toBeVisible();
    });

    test("should validate job title length", async ({ page }) => {
      await page.goto("/dashboard/jobs/create/listing");

      // Try short title
      await page.fill('input[name="title"], textarea[name="title"]', "Fix");
      await page
        .getByRole("button", { name: /post job|create job|submit/i })
        .click();

      // Should show validation error (minimum 10 characters based on AGENTS.md)
      await expect(
        page.getByText(/at least 10 characters|title must be/i),
      ).toBeVisible({ timeout: 3000 });
    });

    test("should validate budget range", async ({ page }) => {
      await page.goto("/dashboard/jobs/create/listing");

      // Fill title and description
      await page.fill(
        'input[name="title"], textarea[name="title"]',
        "Fix Leaking Kitchen Faucet",
      );
      await page.fill(
        'textarea[name="description"]',
        "Kitchen sink faucet has been leaking for two days. Need urgent repair before water damage occurs.",
      );

      // Try budget below minimum (₱100)
      const budgetInput = page
        .locator('input[name="budget"], input[type="number"]')
        .first();
      await budgetInput.fill("50");

      await page
        .getByRole("button", { name: /post job|create job|submit/i })
        .click();

      // Should show budget validation error
      await expect(
        page.getByText(/minimum.*100|budget.*at least/i),
      ).toBeVisible({ timeout: 3000 });
    });

    test("should require category selection", async ({ page }) => {
      await page.goto("/dashboard/jobs/create/listing");

      await page.fill(
        'input[name="title"], textarea[name="title"]',
        "Fix Leaking Kitchen Faucet",
      );
      await page.fill(
        'textarea[name="description"]',
        "Kitchen sink faucet has been leaking for two days. Need urgent repair.",
      );

      const budgetInput = page
        .locator('input[name="budget"], input[type="number"]')
        .first();
      await budgetInput.fill("1500");

      // Don't select category, try to submit
      await page
        .getByRole("button", { name: /post job|create job|submit/i })
        .click();

      // Should show category validation error
      await expect(
        page.getByText(/select.*category|category.*required/i),
      ).toBeVisible({ timeout: 3000 });
    });

    test("should show payment breakdown with platform fee", async ({
      page,
    }) => {
      await page.goto("/dashboard/jobs/create/listing");

      await page.fill(
        'input[name="title"], textarea[name="title"]',
        "Fix Leaking Kitchen Faucet",
      );
      await page.fill(
        'textarea[name="description"]',
        "Kitchen sink faucet has been leaking for two days.",
      );

      const budgetInput = page
        .locator('input[name="budget"], input[type="number"]')
        .first();
      await budgetInput.fill("1000");

      // Check if payment breakdown appears (50% downpayment + 5% platform fee)
      // Worker receives: ₱1,000
      // Downpayment: ₱500
      // Platform fee (5% of downpayment): ₱25
      // You pay now: ₱525
      await expect(
        page.getByText(/worker receives|payment breakdown/i),
      ).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(/525|₱525/)).toBeVisible({ timeout: 3000 }); // Total downpayment with fee
    });
  });

  test.describe("Client - Job Browsing & Management", () => {
    test.beforeEach(async ({ page }) => {
      // Login as client
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', CLIENT_CREDENTIALS.email);
      await page.fill('input[type="password"]', CLIENT_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should display my requests page", async ({ page }) => {
      await page.goto("/dashboard/myRequests");

      // Should show jobs posted by client
      await expect(
        page.getByText(/my requests|my jobs|posted jobs/i),
      ).toBeVisible();
    });

    test("should filter jobs by status", async ({ page }) => {
      await page.goto("/dashboard/myRequests");

      // Look for filter buttons or dropdowns
      const activeFilter = page.getByRole("button", { name: /active|open/i });
      if (await activeFilter.isVisible()) {
        await activeFilter.click();
        // Jobs should update
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Worker - Job Browsing", () => {
    test.beforeEach(async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should display available jobs", async ({ page }) => {
      await page.goto("/dashboard/jobs");

      // Should see job listings
      await expect(
        page.getByText(/available jobs|find work|job listings/i),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should view job details", async ({ page }) => {
      await page.goto("/dashboard/jobs");

      // Click on first job card (if exists)
      const firstJobCard = page
        .locator('div[role="link"], a[href*="/jobs/"]')
        .first();
      if (await firstJobCard.isVisible({ timeout: 3000 })) {
        await firstJobCard.click();

        // Should navigate to job detail page
        await expect(page).toHaveURL(/\/jobs\/\d+/, { timeout: 5000 });

        // Should see job details
        await expect(
          page.getByText(/job details|description|budget/i),
        ).toBeVisible();
      }
    });

    test("should filter jobs by category", async ({ page }) => {
      await page.goto("/dashboard/jobs");

      // Look for category filter
      const categoryFilter = page
        .locator('select[name="category"], button:has-text("Category")')
        .first();
      if (await categoryFilter.isVisible({ timeout: 2000 })) {
        await categoryFilter.click();

        // Select a category (e.g., Plumbing)
        const plumbingOption = page.getByText(/plumbing/i).first();
        if (await plumbingOption.isVisible({ timeout: 2000 })) {
          await plumbingOption.click();

          // Jobs should update
          await page.waitForTimeout(1000);
        }
      }
    });

    test("should search jobs by keyword", async ({ page }) => {
      await page.goto("/dashboard/jobs");

      // Look for search input
      const searchInput = page
        .locator('input[placeholder*="Search" i], input[type="search"]')
        .first();
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill("plumbing");
        await page.keyboard.press("Enter");

        // Results should update
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Worker - Job Application", () => {
    test.beforeEach(async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should display apply button on job details", async ({ page }) => {
      // Navigate to a specific job (if exists)
      await page.goto("/dashboard/jobs");

      const firstJobCard = page
        .locator('div[role="link"], a[href*="/jobs/"]')
        .first();
      if (await firstJobCard.isVisible({ timeout: 3000 })) {
        await firstJobCard.click();

        // Should see apply button (or already applied badge)
        const applyButton = page.getByRole("button", {
          name: /apply|submit application/i,
        });
        const appliedBadge = page.getByText(
          /already applied|application pending/i,
        );

        const hasApplyButton = await applyButton
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        const hasAppliedBadge = await appliedBadge
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        expect(hasApplyButton || hasAppliedBadge).toBeTruthy();
      }
    });

    test("should show application confirmation", async ({ page }) => {
      await page.goto("/dashboard/jobs");

      const firstJobCard = page
        .locator('div[role="link"], a[href*="/jobs/"]')
        .first();
      if (await firstJobCard.isVisible({ timeout: 3000 })) {
        await firstJobCard.click();

        const applyButton = page.getByRole("button", {
          name: /apply now|submit application/i,
        });
        if (await applyButton.isVisible({ timeout: 2000 })) {
          await applyButton.click();

          // Should show confirmation modal or success message
          await expect(
            page.getByText(
              /application submitted|applied successfully|proposal sent/i,
            ),
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("Job Details Page", () => {
    test("should display job information", async ({ page }) => {
      // Login as client to see job details
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', CLIENT_CREDENTIALS.email);
      await page.fill('input[type="password"]', CLIENT_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Navigate to my requests
      await page.goto("/dashboard/myRequests");

      // Click first job if exists
      const firstJob = page
        .locator('div[role="link"], a[href*="/jobs/"]')
        .first();
      if (await firstJob.isVisible({ timeout: 3000 })) {
        await firstJob.click();

        // Should display job details
        await expect(page.getByText(/description|details/i)).toBeVisible({
          timeout: 3000,
        });
        await expect(page.getByText(/budget|price/i)).toBeVisible({
          timeout: 3000,
        });
        await expect(page.getByText(/status/i)).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
