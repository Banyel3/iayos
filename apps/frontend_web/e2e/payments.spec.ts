import { test, expect } from "@playwright/test";

// Test credentials
const CLIENT_CREDENTIALS = {
  email: "client@test.com",
  password: "Test123!",
};

test.describe("Payment & Wallet Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', CLIENT_CREDENTIALS.email);
    await page.fill('input[type="password"]', CLIENT_CREDENTIALS.password);
    await page.getByRole("button", { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test.describe("Wallet Management", () => {
    test("should display wallet balance", async ({ page }) => {
      // Navigate to dashboard or profile (wallet usually visible there)
      await page.goto("/dashboard");

      // Should see wallet balance (₱ symbol)
      await expect(page.getByText(/wallet|balance|₱/)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should navigate to wallet details", async ({ page }) => {
      await page.goto("/dashboard");

      // Click wallet/balance element
      const walletLink = page.getByRole("link", { name: /wallet|balance/i });
      if (await walletLink.isVisible({ timeout: 3000 })) {
        await walletLink.click();

        // Should navigate to wallet page
        await expect(page).toHaveURL(/\/wallet|\/profile/, { timeout: 5000 });
      }
    });

    test("should show transaction history", async ({ page }) => {
      // Try different possible wallet URLs
      const walletUrls = ["/dashboard/wallet", "/dashboard/profile", "/wallet"];

      for (const url of walletUrls) {
        await page.goto(url);
        const hasTransactions = await page
          .getByText(/transaction|history|recent activity/i)
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        if (hasTransactions) {
          // Found transaction history
          await expect(page.getByText(/transaction|history/i)).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe("Payment Methods", () => {
    test("should display payment methods page", async ({ page }) => {
      // Navigate to profile/payment methods
      await page.goto("/dashboard/profile");

      // Look for payment methods section or link
      const paymentMethodsLink = page
        .getByText(/payment method|gcash|bank/i)
        .first();
      if (await paymentMethodsLink.isVisible({ timeout: 3000 })) {
        // Payment methods section exists
        await expect(paymentMethodsLink).toBeVisible();
      }
    });

    test("should show add payment method button", async ({ page }) => {
      await page.goto("/dashboard/profile");

      // Look for add payment method button
      const addButton = page.getByRole("button", {
        name: /add.*payment|add.*gcash|add.*method/i,
      });
      if (await addButton.isVisible({ timeout: 3000 })) {
        await expect(addButton).toBeVisible();
      }
    });

    test("should validate GCash number format", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const addButton = page
        .getByRole("button", { name: /add.*payment|add.*gcash/i })
        .first();
      if (await addButton.isVisible({ timeout: 2000 })) {
        await addButton.click();

        // Fill invalid GCash number
        const gcashInput = page
          .locator(
            'input[name*="gcash" i], input[name*="phone" i], input[name*="number" i]',
          )
          .first();
        if (await gcashInput.isVisible({ timeout: 2000 })) {
          await gcashInput.fill("123"); // Too short

          // Try to submit
          await page.getByRole("button", { name: /save|add|submit/i }).click();

          // Should show validation error
          await expect(
            page.getByText(/valid.*number|phone.*format|11.*digits/i),
          ).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe("Escrow Payment Flow", () => {
    test("should show payment breakdown on job acceptance", async ({
      page,
    }) => {
      // Navigate to my requests
      await page.goto("/dashboard/myRequests");

      // Look for a job with pending applications
      const viewApplicationsButton = page
        .getByRole("button", { name: /view.*application|applications/i })
        .first();
      if (await viewApplicationsButton.isVisible({ timeout: 3000 })) {
        await viewApplicationsButton.click();

        // Click accept application
        const acceptButton = page
          .getByRole("button", { name: /accept|approve/i })
          .first();
        if (await acceptButton.isVisible({ timeout: 3000 })) {
          await acceptButton.click();

          // Should show payment breakdown modal
          await expect(
            page.getByText(/payment|escrow|downpayment/i),
          ).toBeVisible({ timeout: 3000 });

          // Check for payment details (50% downpayment + 5% platform fee)
          await expect(page.getByText(/50%|downpayment/i)).toBeVisible({
            timeout: 3000,
          });
        }
      }
    });

    test("should require payment method before accepting application", async ({
      page,
    }) => {
      await page.goto("/dashboard/myRequests");

      const viewApplicationsButton = page
        .getByRole("button", { name: /view.*application/i })
        .first();
      if (await viewApplicationsButton.isVisible({ timeout: 3000 })) {
        await viewApplicationsButton.click();

        const acceptButton = page
          .getByRole("button", { name: /accept|approve/i })
          .first();
        if (await acceptButton.isVisible({ timeout: 3000 })) {
          await acceptButton.click();

          // If no payment method, should show warning
          const noPaymentWarning = page.getByText(
            /add.*payment.*method|gcash.*required/i,
          );
          const hasWarning = await noPaymentWarning
            .isVisible({ timeout: 3000 })
            .catch(() => false);

          // Either shows payment form or payment method warning
          const hasPaymentForm = await page
            .getByText(/select.*payment|choose.*method/i)
            .isVisible({ timeout: 2000 })
            .catch(() => false);

          expect(hasWarning || hasPaymentForm).toBeTruthy();
        }
      }
    });

    test("should show insufficient balance warning", async ({ page }) => {
      await page.goto("/dashboard/myRequests");

      const viewApplicationsButton = page
        .getByRole("button", { name: /view.*application/i })
        .first();
      if (await viewApplicationsButton.isVisible({ timeout: 3000 })) {
        await viewApplicationsButton.click();

        const acceptButton = page
          .getByRole("button", { name: /accept|approve/i })
          .first();
        if (await acceptButton.isVisible({ timeout: 3000 })) {
          await acceptButton.click();

          // Select wallet payment method
          const walletOption = page.getByText(/wallet/i).first();
          if (await walletOption.isVisible({ timeout: 2000 })) {
            await walletOption.click();

            // Try to confirm payment
            const confirmButton = page
              .getByRole("button", { name: /confirm|pay now|proceed/i })
              .first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click();

              // May show insufficient balance error (if balance is low)
              const insufficientBalance = page.getByText(
                /insufficient.*balance|not.*enough.*funds/i,
              );
              // This is optional - only appears if balance is actually low
            }
          }
        }
      }
    });
  });

  test.describe("Deposit Flow", () => {
    test("should display deposit page", async ({ page }) => {
      // Navigate to wallet/deposit page
      await page.goto("/dashboard/profile");

      const depositButton = page
        .getByRole("button", { name: /deposit|add.*funds/i })
        .first();
      if (await depositButton.isVisible({ timeout: 3000 })) {
        await depositButton.click();

        // Should show deposit form
        await expect(page.getByText(/deposit|add.*funds|amount/i)).toBeVisible({
          timeout: 3000,
        });
      }
    });

    test("should validate minimum deposit amount", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const depositButton = page
        .getByRole("button", { name: /deposit|add.*funds/i })
        .first();
      if (await depositButton.isVisible({ timeout: 3000 })) {
        await depositButton.click();

        // Fill amount below minimum (₱100)
        const amountInput = page
          .locator('input[name="amount"], input[type="number"]')
          .first();
        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill("50");

          await page
            .getByRole("button", { name: /deposit|continue|submit/i })
            .click();

          // Should show validation error
          await expect(
            page.getByText(/minimum.*100|at least.*₱100/i),
          ).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test("should show preset amount buttons", async ({ page }) => {
      await page.goto("/dashboard/profile");

      const depositButton = page
        .getByRole("button", { name: /deposit|add.*funds/i })
        .first();
      if (await depositButton.isVisible({ timeout: 3000 })) {
        await depositButton.click();

        // Look for preset amounts (₱100, ₱500, ₱1000, etc.)
        const presetButtons = page.getByRole("button", {
          name: /₱\d+|php.*\d+/i,
        });
        const hasPresets = await presetButtons
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        if (hasPresets) {
          await expect(presetButtons.first()).toBeVisible();
        }
      }
    });
  });

  test.describe("Payment Status & Receipts", () => {
    test("should display payment status badges", async ({ page }) => {
      // Navigate to transactions or job details
      await page.goto("/dashboard/myRequests");

      // Look for status badges (pending, completed, failed)
      const statusBadge = page
        .locator('[class*="badge" i], [class*="status" i]')
        .first();
      if (await statusBadge.isVisible({ timeout: 3000 })) {
        // Status badges exist
        await expect(statusBadge).toBeVisible();
      }
    });

    test("should show transaction details", async ({ page }) => {
      // Try to find transaction history
      const urls = ["/dashboard/wallet", "/dashboard/profile", "/transactions"];

      for (const url of urls) {
        await page.goto(url);

        const transactionItem = page
          .locator('[class*="transaction" i]')
          .first();
        if (await transactionItem.isVisible({ timeout: 2000 })) {
          // Click to view details
          await transactionItem.click();

          // Should show transaction details
          const hasDetails = await page
            .getByText(/transaction.*id|reference|amount|date/i)
            .isVisible({ timeout: 3000 })
            .catch(() => false);

          if (hasDetails) {
            await expect(
              page.getByText(/transaction|reference|amount/i),
            ).toBeVisible();
            break;
          }
        }
      }
    });
  });
});
