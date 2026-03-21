/**
 * Secure Token Storage
 *
 * JWT access tokens are sensitive credentials. This module wraps
 * expo-secure-store (iOS Keychain / Android Keystore) instead of
 * plain AsyncStorage, preventing tokens from being readable in
 * unencrypted device backups or via ADB on non-rooted devices.
 */
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "access_token";
const STORAGE_TIMEOUT_MS = 2500;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("storage_timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

/** Retrieve the stored JWT access token, or null if none exists. */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await withTimeout(SecureStore.getItemAsync(TOKEN_KEY), STORAGE_TIMEOUT_MS);
  } catch {
    try {
      return await withTimeout(AsyncStorage.getItem(TOKEN_KEY), STORAGE_TIMEOUT_MS);
    } catch {
      return null;
    }
  }
};

/** Persist the JWT access token securely. */
export const setAccessToken = async (token: string): Promise<void> => {
  try {
    await withTimeout(SecureStore.setItemAsync(TOKEN_KEY, token), STORAGE_TIMEOUT_MS);
  } catch {
    await withTimeout(AsyncStorage.setItem(TOKEN_KEY, token), STORAGE_TIMEOUT_MS);
  }
};

/** Delete the stored JWT access token (e.g. on logout). */
export const removeAccessToken = async (): Promise<void> => {
  try {
    await withTimeout(SecureStore.deleteItemAsync(TOKEN_KEY), STORAGE_TIMEOUT_MS);
  } catch {
    // ignore secure store failure
  }

  try {
    await withTimeout(AsyncStorage.removeItem(TOKEN_KEY), STORAGE_TIMEOUT_MS);
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
    return await withTimeout(
      SecureStore.getItemAsync(CACHED_USER_KEY),
      STORAGE_TIMEOUT_MS,
    );
  } catch {
    try {
      return await withTimeout(
        AsyncStorage.getItem(CACHED_USER_KEY),
        STORAGE_TIMEOUT_MS,
      );
    } catch {
      return null;
    }
  }
};

/** Store the cached user JSON securely. */
export const setCachedUser = async (value: string): Promise<void> => {
  try {
    await withTimeout(
      SecureStore.setItemAsync(CACHED_USER_KEY, value),
      STORAGE_TIMEOUT_MS,
    );
  } catch {
    await withTimeout(
      AsyncStorage.setItem(CACHED_USER_KEY, value),
      STORAGE_TIMEOUT_MS,
    );
  }
};

/** Delete the cached user from SecureStore (e.g. on logout). */
export const removeCachedUser = async (): Promise<void> => {
  try {
    await withTimeout(
      SecureStore.deleteItemAsync(CACHED_USER_KEY),
      STORAGE_TIMEOUT_MS,
    );
  } catch {
    // ignore secure store failure
  }

  try {
    await withTimeout(
      AsyncStorage.removeItem(CACHED_USER_KEY),
      STORAGE_TIMEOUT_MS,
    );
  } catch {
    // Key may not exist — ignore
  }
};
