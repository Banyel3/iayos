import { useQuery } from "@tanstack/react-query";
import {
  fetchWorkers,
  fetchAgencies,
  fetchMyJobs,
  fetchInProgressJobs,
  fetchCompletedJobs,
} from "@/lib/api/jobs";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  type Transaction,
} from "@/lib/api/wallet";
import type {
  WorkerListing,
  AgencyListing,
  MyJobRequest,
  JobPosting,
} from "@/lib/api/jobs";

// SessionStorage keys for home page
const WORKERS_STORAGE_KEY = "iayos_home_workers";
const AGENCIES_STORAGE_KEY = "iayos_home_agencies";
const WORKERS_TIMESTAMP_KEY = "iayos_home_workers_timestamp";
const AGENCIES_TIMESTAMP_KEY = "iayos_home_agencies_timestamp";

// SessionStorage keys for my-jobs page
const MY_JOBS_STORAGE_KEY = "iayos_my_jobs";
const MY_JOBS_TIMESTAMP_KEY = "iayos_my_jobs_timestamp";
const IN_PROGRESS_STORAGE_KEY = "iayos_in_progress_jobs";
const IN_PROGRESS_TIMESTAMP_KEY = "iayos_in_progress_jobs_timestamp";
const COMPLETED_JOBS_STORAGE_KEY = "iayos_completed_jobs";
const COMPLETED_JOBS_TIMESTAMP_KEY = "iayos_completed_jobs_timestamp";

// SessionStorage keys for profile page
const WALLET_BALANCE_STORAGE_KEY = "iayos_wallet_balance";
const WALLET_BALANCE_TIMESTAMP_KEY = "iayos_wallet_balance_timestamp";
const WALLET_TRANSACTIONS_STORAGE_KEY = "iayos_wallet_transactions";
const WALLET_TRANSACTIONS_TIMESTAMP_KEY = "iayos_wallet_transactions_timestamp";

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Get cached data from sessionStorage with timestamp validation
 */
function getCachedData<T>(storageKey: string, timestampKey: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(storageKey);
    const timestamp = sessionStorage.getItem(timestampKey);

    if (!cached || !timestamp) return null;

    // Check if cache is still valid (within 24 hours)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION) {
      // Cache expired, clear it
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(timestampKey);
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error("Error reading from sessionStorage:", error);
    return null;
  }
}

/**
 * Save data to sessionStorage with timestamp
 */
function setCachedData<T>(
  storageKey: string,
  timestampKey: string,
  data: T
): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(data));
    sessionStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.error("Error writing to sessionStorage:", error);
  }
}

/**
 * Hook to fetch workers with sessionStorage caching
 * - Shows cached data instantly on mount
 * - Fetches fresh data in background
 * - Updates cache after successful fetch
 */
export function useHomeWorkers(enabled: boolean = true) {
  return useQuery({
    queryKey: ["home", "workers"],
    queryFn: async () => {
      const data = await fetchWorkers();
      // Save to sessionStorage after successful fetch
      setCachedData(WORKERS_STORAGE_KEY, WORKERS_TIMESTAMP_KEY, data);
      return data;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      // Return cached data immediately while fetching
      const cached = getCachedData<WorkerListing[]>(
        WORKERS_STORAGE_KEY,
        WORKERS_TIMESTAMP_KEY
      );
      return cached || undefined;
    },
  });
}

/**
 * Hook to fetch agencies with sessionStorage caching
 * - Shows cached data instantly on mount
 * - Fetches fresh data in background
 * - Updates cache after successful fetch
 */
export function useHomeAgencies(
  enabled: boolean = true,
  params?: {
    limit?: number;
    sortBy?: "rating" | "jobs" | "created";
  }
) {
  return useQuery({
    queryKey: ["home", "agencies", params],
    queryFn: async () => {
      const data = await fetchAgencies(
        params || { limit: 12, sortBy: "rating" }
      );
      // Save to sessionStorage after successful fetch
      setCachedData(AGENCIES_STORAGE_KEY, AGENCIES_TIMESTAMP_KEY, data);
      return data;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      // Return cached data immediately while fetching
      const cached = getCachedData<AgencyListing[]>(
        AGENCIES_STORAGE_KEY,
        AGENCIES_TIMESTAMP_KEY
      );
      return cached || undefined;
    },
  });
}

/**
 * Hook to fetch client's job postings (my-jobs) with sessionStorage
 * - Shows cached data instantly on mount
 * - Fetches fresh data in background
 * - Updates cache after successful fetch
 */
export function useMyJobs(enabled: boolean = true) {
  return useQuery({
    queryKey: ["myJobs"],
    queryFn: async () => {
      const data = await fetchMyJobs();
      setCachedData(MY_JOBS_STORAGE_KEY, MY_JOBS_TIMESTAMP_KEY, data);
      return data;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      const cached = getCachedData<MyJobRequest[]>(
        MY_JOBS_STORAGE_KEY,
        MY_JOBS_TIMESTAMP_KEY
      );
      return cached || undefined;
    },
  });
}

/**
 * Hook to fetch in-progress jobs with sessionStorage
 * - Shows cached data instantly on mount
 * - Fetches fresh data in background
 * - Updates cache after successful fetch
 */
export function useInProgressJobs(enabled: boolean = true) {
  return useQuery({
    queryKey: ["inProgressJobs"],
    queryFn: async () => {
      const data = await fetchInProgressJobs();
      setCachedData(IN_PROGRESS_STORAGE_KEY, IN_PROGRESS_TIMESTAMP_KEY, data);
      return data;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      const cached = getCachedData<MyJobRequest[]>(
        IN_PROGRESS_STORAGE_KEY,
        IN_PROGRESS_TIMESTAMP_KEY
      );
      return cached || undefined;
    },
  });
}

/**
 * Hook to fetch completed jobs with sessionStorage
 * - Shows cached data instantly on mount
 * - Fetches fresh data in background
 * - Updates cache after successful fetch
 */
export function useCompletedJobs(enabled: boolean = true) {
  return useQuery({
    queryKey: ["completedJobs"],
    queryFn: async () => {
      const data = await fetchCompletedJobs();
      setCachedData(
        COMPLETED_JOBS_STORAGE_KEY,
        COMPLETED_JOBS_TIMESTAMP_KEY,
        data
      );
      return data;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      const cached = getCachedData<JobPosting[]>(
        COMPLETED_JOBS_STORAGE_KEY,
        COMPLETED_JOBS_TIMESTAMP_KEY
      );
      return cached || undefined;
    },
  });
}

/**
 * Hook to fetch wallet balance with sessionStorage
 * - Shows cached balance instantly on mount
 * - Fetches fresh balance in background
 * - Updates cache after successful fetch
 */
export function useWalletBalance(enabled: boolean = true) {
  return useQuery({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      const balance = await fetchWalletBalance();
      setCachedData(
        WALLET_BALANCE_STORAGE_KEY,
        WALLET_BALANCE_TIMESTAMP_KEY,
        balance
      );
      return balance;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      const cached = getCachedData<number>(
        WALLET_BALANCE_STORAGE_KEY,
        WALLET_BALANCE_TIMESTAMP_KEY
      );
      return cached !== null ? cached : undefined;
    },
  });
}

/**
 * Hook to fetch wallet transactions with sessionStorage
 * - Shows cached transactions instantly on mount
 * - Fetches fresh transactions in background
 * - Updates cache after successful fetch
 */
export function useWalletTransactions(enabled: boolean = true) {
  return useQuery({
    queryKey: ["walletTransactions"],
    queryFn: async () => {
      const transactions = await fetchWalletTransactions();
      setCachedData(
        WALLET_TRANSACTIONS_STORAGE_KEY,
        WALLET_TRANSACTIONS_TIMESTAMP_KEY,
        transactions
      );
      return transactions;
    },
    enabled,
    staleTime: 0, // Always refetch in background
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: () => {
      const cached = getCachedData<Transaction[]>(
        WALLET_TRANSACTIONS_STORAGE_KEY,
        WALLET_TRANSACTIONS_TIMESTAMP_KEY
      );
      return cached || undefined;
    },
  });
}
