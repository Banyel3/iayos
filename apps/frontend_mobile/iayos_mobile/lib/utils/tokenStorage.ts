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

// ---------------------------------------------------------------------------
// Cached user — store in SecureStore instead of plain AsyncStorage so that
// profile data is encrypted at rest and not accessible to other apps.
// ---------------------------------------------------------------------------
const CACHED_USER_KEY = "cached_user";

/** Retrieve the cached user JSON from SecureStore. */
export const getCachedUser = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(CACHED_USER_KEY);
  } catch {
    return null;
  }
};

/** Store the cached user JSON securely. */
export const setCachedUser = async (value: string): Promise<void> => {
  await SecureStore.setItemAsync(CACHED_USER_KEY, value);
};

/** Delete the cached user from SecureStore (e.g. on logout). */
export const removeCachedUser = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(CACHED_USER_KEY);
  } catch {
    // Key may not exist — ignore
  }
};
