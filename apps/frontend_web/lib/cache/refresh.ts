/**
 * Manual Cache Refresh Utilities
 *
 * Provides functions to manually refresh cached data by tier.
 * Use these for "Pull to Refresh" UI patterns or manual refresh buttons.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Refresh all Tier 1 data (static data that's cached forever)
 * - Job categories
 * - Certifications
 * - Portfolio images
 */
export async function refreshStaticData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["jobs", "categories"] }),
    queryClient.invalidateQueries({
      queryKey: ["worker-profile", "certifications"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["worker-profile", "portfolio"],
    }),
  ]);
}

/**
 * Refresh all Tier 2 data (semi-static data with 1hr background refresh)
 * - Profile completion
 * - Workers list
 */
export async function refreshSemiStaticData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["worker-profile", "completion"],
    }),
    queryClient.invalidateQueries({ queryKey: ["jobs", "workers"] }),
  ]);
}

/**
 * Refresh all Tier 3 data (dynamic data with 10min background refresh)
 * - Available jobs
 * - My applications
 * - Conversations
 */
export async function refreshDynamicData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["jobs", "available"] }),
    queryClient.invalidateQueries({ queryKey: ["jobs", "applications"] }),
    queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] }),
  ]);
}

/**
 * Refresh ALL cached data (use sparingly, e.g., logout/login)
 */
export async function refreshAllData(queryClient: QueryClient) {
  await queryClient.invalidateQueries();
}

/**
 * Refresh specific page data based on current route
 */
export async function refreshPageData(
  queryClient: QueryClient,
  pathname: string
) {
  if (pathname.includes("/jobs")) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["jobs", "available"] }),
      queryClient.invalidateQueries({ queryKey: ["jobs", "categories"] }),
    ]);
  } else if (pathname.includes("/inbox")) {
    await queryClient.invalidateQueries({ queryKey: ["inbox"] });
  } else if (pathname.includes("/profile")) {
    await queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
  } else if (pathname.includes("/dashboard")) {
    await refreshDynamicData(queryClient);
  }
}

/**
 * Smart refresh based on last update time
 * Only refreshes if cache is older than specified age
 */
export async function smartRefresh(
  queryClient: QueryClient,
  queryKey: string[],
  maxAge: number = 5 * 60 * 1000 // 5 minutes default
) {
  const cache = queryClient.getQueryData(queryKey);
  const state = queryClient.getQueryState(queryKey);

  if (!state || !state.dataUpdatedAt) {
    // No cache, fetch immediately
    await queryClient.invalidateQueries({ queryKey });
    return;
  }

  const age = Date.now() - state.dataUpdatedAt;
  if (age > maxAge) {
    await queryClient.invalidateQueries({ queryKey });
  }
}
