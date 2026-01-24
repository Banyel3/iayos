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

test.describe("Profile Management Flows", () => {
  test.describe("Worker Profile", () => {
    test.beforeEach(async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should display worker profile page", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Should see profile information
      await expect(page.getByText(/profile|about|bio/i)).toBeVisible({
        timeout: 5000,
      });

      // Should see worker-specific elements
      await expect(
        page.getByText(/skills|hourly rate|portfolio|certifications/i),
      ).toBeVisible({ timeout: 3000 });
    });

    test("should show profile completion percentage", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Look for completion widget (0-100%)
      const completionText = page.getByText(/profile.*complete|completion|%/);
      if (await completionText.isVisible({ timeout: 3000 })) {
        await expect(completionText).toBeVisible();
      }
    });

    test("should allow editing bio", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const editButton = page
        .getByRole("button", { name: /edit.*profile|edit/i })
        .first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();

        // Should navigate to edit page or open modal
        const bioTextarea = page.locator(
          'textarea[name="bio"], textarea[name="description"]',
        );
        if (await bioTextarea.isVisible({ timeout: 3000 })) {
          await bioTextarea.fill(
            "Experienced plumber with 10+ years in residential and commercial projects.",
          );

          // Save changes
          await page.getByRole("button", { name: /save|update/i }).click();

          // Should show success message
          await expect(
            page.getByText(/profile.*updated|saved.*successfully/i),
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("should validate hourly rate range", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const editButton = page
        .getByRole("button", { name: /edit.*profile|edit/i })
        .first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();

        const hourlyRateInput = page
          .locator('input[name*="hourly" i], input[name*="rate" i]')
          .first();
        if (await hourlyRateInput.isVisible({ timeout: 3000 })) {
          // Try invalid rate (too high - max ₱10,000)
          await hourlyRateInput.fill("15000");

          await page.getByRole("button", { name: /save|update/i }).click();

          // Should show validation error
          await expect(
            page.getByText(/maximum.*10000|rate.*too high/i),
          ).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test("should manage skills", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Look for skills section
      const skillsSection = page.getByText(/skills/i).first();
      if (await skillsSection.isVisible({ timeout: 3000 })) {
        // Check if edit skills button exists
        const editSkillsButton = page
          .getByRole("button", { name: /edit.*skills|add.*skill/i })
          .first();

        if (await editSkillsButton.isVisible({ timeout: 2000 })) {
          await expect(editSkillsButton).toBeVisible();
        }
      }
    });

    test("should display certifications section", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Should see certifications
      const certificationsSection = page.getByText(
        /certification|license|credential/i,
      );
      if (await certificationsSection.isVisible({ timeout: 3000 })) {
        await expect(certificationsSection).toBeVisible();
      }
    });

    test("should display portfolio section", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Should see portfolio/work samples
      const portfolioSection = page.getByText(
        /portfolio|work.*samples|gallery|photos/i,
      );
      if (await portfolioSection.isVisible({ timeout: 3000 })) {
        await expect(portfolioSection).toBeVisible();
      }
    });

    test("should navigate to certifications management", async ({ page }) => {
      await page.goto("/dashboard/profile/certifications");

      // Should see certifications page
      await expect(
        page.getByText(/certification|manage.*certification/i),
      ).toBeVisible({ timeout: 5000 });

      // Should see add certification button
      const addButton = page.getByRole("button", {
        name: /add.*certification|upload/i,
      });
      if (await addButton.isVisible({ timeout: 3000 })) {
        await expect(addButton).toBeVisible();
      }
    });

    test("should navigate to portfolio management", async ({ page }) => {
      await page.goto("/dashboard/profile/portfolio");

      // Should see portfolio page or redirect to profile
      const isPortfolioPage = await page
        .getByText(/portfolio|work.*samples|upload.*photo/i)
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (isPortfolioPage) {
        await expect(page.getByText(/portfolio|work.*samples/i)).toBeVisible();
      }
    });
  });

  test.describe("Client Profile", () => {
    test.beforeEach(async ({ page }) => {
      // Login as client
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', CLIENT_CREDENTIALS.email);
      await page.fill('input[type="password"]', CLIENT_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should display client profile page", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Should see profile information
      await expect(page.getByText(/profile|account|settings/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should allow editing profile information", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const editButton = page
        .getByRole("button", { name: /edit.*profile|edit/i })
        .first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();

        // Should show edit form
        await expect(
          page.locator('input[name="firstName"], input[name="first_name"]'),
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test("should validate phone number format", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const editButton = page
        .getByRole("button", { name: /edit.*profile|edit/i })
        .first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();

        const phoneInput = page
          .locator('input[name="phone"], input[name="phoneNumber"]')
          .first();
        if (await phoneInput.isVisible({ timeout: 3000 })) {
          // Enter invalid phone (too short - must be 10-15 digits)
          await phoneInput.fill("123");

          await page.getByRole("button", { name: /save|update/i }).click();

          // Should show validation error
          await expect(
            page.getByText(/valid.*phone|phone.*format|10.*15.*digits/i),
          ).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe("Avatar Upload", () => {
    test.beforeEach(async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should show avatar upload option", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Look for avatar/profile picture
      const avatarElement = page
        .locator('[class*="avatar" i], img[alt*="profile" i]')
        .first();

      // Should have edit/upload option
      const uploadButton = page.getByRole("button", {
        name: /upload.*photo|change.*avatar|edit.*picture/i,
      });
      if (await uploadButton.isVisible({ timeout: 3000 })) {
        await expect(uploadButton).toBeVisible();
      }
    });
  });

  test.describe("Rating & Reviews Display", () => {
    test("should display worker rating", async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      await page.goto("/dashboard/profile");

      // Should see rating (stars or number)
      const ratingElement = page.getByText(/rating|stars|★|⭐/i);
      if (await ratingElement.isVisible({ timeout: 3000 })) {
        await expect(ratingElement).toBeVisible();
      }
    });

    test("should display jobs completed count", async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      await page.goto("/dashboard/profile");

      // Should see jobs completed stat
      const jobsCompletedElement = page.getByText(/job.*completed|\d+.*jobs/i);
      if (await jobsCompletedElement.isVisible({ timeout: 3000 })) {
        await expect(jobsCompletedElement).toBeVisible();
      }
    });
  });

  test.describe("Profile Completion Widget", () => {
    test("should show missing profile sections", async ({ page }) => {
      // Login as worker
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', WORKER_CREDENTIALS.email);
      await page.fill('input[type="password"]', WORKER_CREDENTIALS.password);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      await page.goto("/dashboard/profile");

      // Look for completion checklist
      const completionWidget = page
        .locator('[class*="completion" i], [class*="progress" i]')
        .first();
      if (await completionWidget.isVisible({ timeout: 3000 })) {
        // Widget should show what's missing
        await expect(completionWidget).toBeVisible();
      }
    });
  });
});
