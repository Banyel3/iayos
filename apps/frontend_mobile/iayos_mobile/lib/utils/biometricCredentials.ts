/**
 * biometricCredentials
 * Stores and retrieves email+password in SecureStore so biometric auth can
 * re-use them for a quick login without the user typing again.
 *
 * Nothing is sent to the backend until the user confirms biometric.
 */

import * as SecureStore from "expo-secure-store";

const EMAIL_KEY = "biometric_email";
const PASSWORD_KEY = "biometric_password";
const ENABLED_KEY = "biometric_enabled";

/** Save credentials after a successful manual login (call only with user consent). */
export async function saveBiometricCredentials(
  email: string,
  password: string
): Promise<void> {
  await SecureStore.setItemAsync(EMAIL_KEY, email);
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
  await SecureStore.setItemAsync(ENABLED_KEY, "true");
}

/** Retrieve stored credentials. Returns null if not set or not enabled. */
export async function getBiometricCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  try {
    const enabled = await SecureStore.getItemAsync(ENABLED_KEY);
    if (enabled !== "true") return null;

    const email = await SecureStore.getItemAsync(EMAIL_KEY);
    const password = await SecureStore.getItemAsync(PASSWORD_KEY);

    if (email && password) return { email, password };
    return null;
  } catch {
    return null;
  }
}

/** Returns true if biometric quick-login has stored credentials. */
export async function hasBiometricCredentials(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(ENABLED_KEY);
    return enabled === "true";
  } catch {
    return false;
  }
}

/** Clear stored credentials (e.g. on logout or user disables feature). */
export async function clearBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
  await SecureStore.deleteItemAsync(ENABLED_KEY);
}
