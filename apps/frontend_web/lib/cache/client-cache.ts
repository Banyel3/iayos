/**
 * Client-side cache utilities using cookies and localStorage
 * Improves loading times by caching frequently accessed data
 */

import Cookies from "js-cookie";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  storage?: "cookie" | "localStorage" | "both";
}

const DEFAULT_TTL = 300; // 5 minutes default
const MAX_COOKIE_SIZE = 4000; // Stay under 4KB cookie limit

/**
 * Generate a cache key with timestamp
 */
function getCacheKey(key: string): string {
  return `cache_${key}`;
}

/**
 * Get timestamp key for TTL checking
 */
function getTimestampKey(key: string): string {
  return `cache_ts_${key}`;
}

/**
 * Check if cached data is still valid
 */
function isValid(key: string, ttl: number): boolean {
  const timestampKey = getTimestampKey(key);

  // Check localStorage first
  const lsTimestamp = localStorage.getItem(timestampKey);
  if (lsTimestamp) {
    const age = Date.now() - parseInt(lsTimestamp, 10);
    return age < ttl * 1000;
  }

  // Check cookies
  const cookieTimestamp = Cookies.get(timestampKey);
  if (cookieTimestamp) {
    const age = Date.now() - parseInt(cookieTimestamp, 10);
    return age < ttl * 1000;
  }

  return false;
}

/**
 * Get cached data
 */
export function getCached<T>(key: string): T | null {
  const cacheKey = getCacheKey(key);

  // Try localStorage first (larger storage)
  try {
    const lsData = localStorage.getItem(cacheKey);
    if (lsData) {
      const timestampKey = getTimestampKey(key);
      const lsTimestamp = localStorage.getItem(timestampKey);
      if (lsTimestamp) {
        return JSON.parse(lsData) as T;
      }
    }
  } catch (e) {
    console.warn("localStorage read failed:", e);
  }

  // Fall back to cookies
  try {
    const cookieData = Cookies.get(cacheKey);
    if (cookieData) {
      return JSON.parse(cookieData) as T;
    }
  } catch (e) {
    console.warn("Cookie read failed:", e);
  }

  return null;
}

/**
 * Set cached data with TTL
 */
export function setCached<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const { ttl = DEFAULT_TTL, storage = "both" } = options;
  const cacheKey = getCacheKey(key);
  const timestampKey = getTimestampKey(key);
  const timestamp = Date.now().toString();
  const serialized = JSON.stringify(data);

  // Try localStorage (preferred for large data)
  if (storage === "localStorage" || storage === "both") {
    try {
      localStorage.setItem(cacheKey, serialized);
      localStorage.setItem(timestampKey, timestamp);
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  }

  // Use cookies for smaller data or as fallback
  if (storage === "cookie" || storage === "both") {
    if (serialized.length < MAX_COOKIE_SIZE) {
      try {
        Cookies.set(cacheKey, serialized, { expires: ttl / 86400 }); // Convert seconds to days
        Cookies.set(timestampKey, timestamp, { expires: ttl / 86400 });
      } catch (e) {
        console.warn("Cookie write failed:", e);
      }
    }
  }
}

/**
 * Check if cache is valid for a key
 */
export function isCacheValid(key: string, ttl: number = DEFAULT_TTL): boolean {
  return isValid(key, ttl);
}

/**
 * Invalidate (delete) cached data
 */
export function invalidateCache(key: string): void {
  const cacheKey = getCacheKey(key);
  const timestampKey = getTimestampKey(key);

  // Remove from localStorage
  try {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(timestampKey);
  } catch (e) {
    console.warn("localStorage remove failed:", e);
  }

  // Remove from cookies
  Cookies.remove(cacheKey);
  Cookies.remove(timestampKey);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  // Clear localStorage cache entries
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("cache_")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn("localStorage clear failed:", e);
  }

  // Clear cookie cache entries
  const allCookies = Cookies.get();
  Object.keys(allCookies).forEach((key) => {
    if (key.startsWith("cache_")) {
      Cookies.remove(key);
    }
  });
}

/**
 * Fetch with cache wrapper
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  // Check cache first
  if (isCacheValid(key, ttl)) {
    const cached = getCached<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  setCached(key, data, options);

  return data;
}
