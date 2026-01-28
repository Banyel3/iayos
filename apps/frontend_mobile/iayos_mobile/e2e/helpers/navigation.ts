import { element, by, waitFor } from "detox";

/**
 * Navigate to specific tab
 */
export async function navigateToTab(
  tabId: "home" | "jobs" | "myjobs" | "messages" | "profile",
) {
  await element(by.id(`tab-${tabId}`)).tap();
  await waitFor(element(by.id(`${tabId}-screen`)))
    .toBeVisible()
    .withTimeout(3000);
}

/**
 * Go back using device back button (Android) or navigation
 */
export async function goBack() {
  await element(by.id("back-button")).tap();
}

/**
 * Scroll to element in a scroll view
 */
export async function scrollToElement(
  scrollViewId: string,
  elementId: string,
  direction: "up" | "down" = "down",
  distance: number = 300,
) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(distance, direction);
}

/**
 * Swipe on element (for carousels, image galleries)
 */
export async function swipe(
  elementId: string,
  direction: "left" | "right" | "up" | "down",
  speed: "fast" | "slow" = "fast",
) {
  await element(by.id(elementId)).swipe(direction, speed);
}

/**
 * Wait for screen to load
 */
export async function waitForScreen(screenId: string, timeout: number = 5000) {
  await waitFor(element(by.id(screenId)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Check if element exists without waiting
 */
export async function elementExists(elementId: string): Promise<boolean> {
  try {
    await expect(element(by.id(elementId))).toExist();
    return true;
  } catch (e) {
    return false;
  }
}
