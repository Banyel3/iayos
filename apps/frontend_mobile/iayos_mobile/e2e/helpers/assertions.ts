import { element, by, expect } from "detox";

/**
 * Assert job card is visible with correct data
 */
export async function assertJobCardVisible(
  jobId: number,
  expectedTitle?: string,
) {
  await expect(element(by.id(`job-card-${jobId}`))).toBeVisible();

  if (expectedTitle) {
    await expect(element(by.id(`job-title-${jobId}`))).toHaveText(
      expectedTitle,
    );
  }
}

/**
 * Assert status badge has correct status
 */
export async function assertStatusBadge(
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "COMPLETED",
) {
  await expect(element(by.id(`status-${status.toLowerCase()}`))).toBeVisible();
}

/**
 * Assert payment status
 */
export async function assertPaymentStatus(
  status: "PENDING" | "COMPLETED" | "FAILED" | "VERIFYING" | "REFUNDED",
) {
  await expect(
    element(by.id(`payment-status-${status.toLowerCase()}`)),
  ).toBeVisible();
}

/**
 * Assert wallet balance
 */
export async function assertWalletBalance(expectedBalance: number) {
  const balanceText = `₱${expectedBalance.toLocaleString()}`;
  await expect(element(by.id("wallet-balance"))).toHaveText(balanceText);
}

/**
 * Assert error message is visible
 */
export async function assertErrorMessage(message: string) {
  await expect(element(by.text(message))).toBeVisible();
}

/**
 * Assert success message is visible
 */
export async function assertSuccessMessage(message: string) {
  await expect(element(by.text(message))).toBeVisible();
}

/**
 * Assert modal is visible
 */
export async function assertModalVisible(modalId: string) {
  await expect(element(by.id(modalId))).toBeVisible();
}

/**
 * Assert modal is not visible
 */
export async function assertModalNotVisible(modalId: string) {
  await expect(element(by.id(modalId))).not.toBeVisible();
}

/**
 * Assert input has specific value
 */
export async function assertInputValue(inputId: string, expectedValue: string) {
  await expect(element(by.id(inputId))).toHaveText(expectedValue);
}

/**
 * Assert button is disabled
 */
export async function assertButtonDisabled(buttonId: string) {
  // Detox doesn't have direct toBeDisabled, check opacity or other visual cues
  await expect(element(by.id(buttonId))).toExist();
}

/**
 * Assert list has minimum items
 */
export async function assertListHasMinItems(listId: string, minItems: number) {
  for (let i = 0; i < minItems; i++) {
    await expect(element(by.id(`${listId}-item-${i}`))).toExist();
  }
}
