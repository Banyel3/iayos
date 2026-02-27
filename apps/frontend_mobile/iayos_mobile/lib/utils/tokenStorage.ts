/**
 * Secure Token Storage
 *
 * JWT access tokens are sensitive credentials. This module wraps
 * expo-secure-store (iOS Keychain / Android Keystore) instead of
 * plain AsyncStorage, preventing tokens from being readable in
 * unencrypted device backups or via ADB on non-rooted devices.
 */
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "access_token";

/** Retrieve the stored JWT access token, or null if none exists. */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
};

/** Persist the JWT access token securely. */
export const setAccessToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

/** Delete the stored JWT access token (e.g. on logout). */
export const removeAccessToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Key may not exist — ignore
  }
};
