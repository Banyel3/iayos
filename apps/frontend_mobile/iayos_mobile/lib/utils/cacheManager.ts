import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@iayos_cache_';
const CACHE_EXPIRY_PREFIX = '@iayos_cache_expiry_';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean; // Whether to compress data
}

export class CacheManager {
  /**
   * Store data in cache with optional TTL
   */
  static async set(
    key: string,
    data: any,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const expiryKey = CACHE_EXPIRY_PREFIX + key;

      const serialized = JSON.stringify(data);

      // Store data
      await AsyncStorage.setItem(cacheKey, serialized);

      // Store expiry if TTL provided
      if (options.ttl) {
        const expiryTime = Date.now() + options.ttl;
        await AsyncStorage.setItem(expiryKey, expiryTime.toString());
      }
    } catch (error) {
      console.error('CacheManager.set error:', error);
    }
  }

  /**
   * Get data from cache, returns null if expired or not found
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const expiryKey = CACHE_EXPIRY_PREFIX + key;

      // Check if expired
      const expiryTimeStr = await AsyncStorage.getItem(expiryKey);
      if (expiryTimeStr) {
        const expiryTime = parseInt(expiryTimeStr, 10);
        if (Date.now() > expiryTime) {
          // Expired, remove from cache
          await this.remove(key);
          return null;
        }
      }

      // Get data
      const serialized = await AsyncStorage.getItem(cacheKey);
      if (!serialized) return null;

      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('CacheManager.get error:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  static async remove(key: string): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const expiryKey = CACHE_EXPIRY_PREFIX + key;

      await AsyncStorage.multiRemove([cacheKey, expiryKey]);
    } catch (error) {
      console.error('CacheManager.remove error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  static async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(
        (key) =>
          key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('CacheManager.clearAll error:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpired(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const expiryKeys = allKeys.filter((key) =>
        key.startsWith(CACHE_EXPIRY_PREFIX)
      );

      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const expiryKey of expiryKeys) {
        const expiryTimeStr = await AsyncStorage.getItem(expiryKey);
        if (expiryTimeStr) {
          const expiryTime = parseInt(expiryTimeStr, 10);
          if (now > expiryTime) {
            const originalKey = expiryKey.replace(CACHE_EXPIRY_PREFIX, '');
            expiredKeys.push(CACHE_PREFIX + originalKey);
            expiredKeys.push(expiryKey);
          }
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }
    } catch (error) {
      console.error('CacheManager.clearExpired error:', error);
    }
  }

  /**
   * Get cache size in bytes (approximate)
   */
  static async getCacheSize(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) => key.startsWith(CACHE_PREFIX));

      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('CacheManager.getCacheSize error:', error);
      return 0;
    }
  }

  /**
   * Get human-readable cache size
   */
  static async getCacheSizeFormatted(): Promise<string> {
    const bytes = await this.getCacheSize();
    return this.formatBytes(bytes);
  }

  /**
   * Format bytes to human-readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if cache entry exists and is valid
   */
  static async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Get multiple cache entries
   */
  static async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const promises = keys.map((key) => this.get<T>(key));
      return await Promise.all(promises);
    } catch (error) {
      console.error('CacheManager.getMultiple error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple cache entries
   */
  static async setMultiple(
    entries: { key: string; data: any; options?: CacheOptions }[]
  ): Promise<void> {
    try {
      const promises = entries.map((entry) =>
        this.set(entry.key, entry.data, entry.options)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('CacheManager.setMultiple error:', error);
    }
  }
}

// Export convenience functions
export const setCache = CacheManager.set.bind(CacheManager);
export const getCache = CacheManager.get.bind(CacheManager);
export const removeCache = CacheManager.remove.bind(CacheManager);
export const clearCache = CacheManager.clearAll.bind(CacheManager);
export const getCacheSize = CacheManager.getCacheSize.bind(CacheManager);
