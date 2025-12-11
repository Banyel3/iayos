/**
 * Server-side cache utilities using Next.js cache
 * For use in Server Components and Route Handlers
 */

import { unstable_cache } from "next/cache";

export interface ServerCacheOptions {
  revalidate?: number; // Revalidate after N seconds
  tags?: string[]; // Cache tags for granular invalidation
}

/**
 * Wrapper for Next.js unstable_cache with better defaults
 */
export function createCachedFunction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyPrefix: string,
  options: ServerCacheOptions = {}
) {
  const { revalidate = 300, tags = [] } = options; // 5 min default

  return unstable_cache(fn, [keyPrefix], {
    revalidate,
    tags: [keyPrefix, ...tags],
  });
}

/**
 * Common cache tag generators
 */
export const CacheTags = {
  user: (userId: string) => `user-${userId}`,
  jobs: () => "jobs",
  jobDetail: (jobId: string) => `job-${jobId}`,
  workers: () => "workers",
  workerProfile: (userId: string) => `worker-${userId}`,
  agencies: () => "agencies",
  agencyDetail: (agencyId: string) => `agency-${agencyId}`,
  categories: () => "categories",
  conversations: (userId: string) => `conversations-${userId}`,
  notifications: (userId: string) => `notifications-${userId}`,
} as const;

/**
 * Common revalidation times
 */
export const RevalidateTimes = {
  NEVER: false as const,
  INSTANT: 0,
  MINUTE: 60,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  THIRTY_MINUTES: 1800,
  HOUR: 3600,
  DAY: 86400,
} as const;
