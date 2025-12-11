/**
 * useJobs Hook - Fetch and manage job listings
 *
 * Features:
 * - Fetch available jobs with filters
 * - Pagination support
 * - Caching with TanStack Query
 * - Optimistic updates
 */

import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/query-core";
import { ENDPOINTS, apiRequest, fetchJson } from "@/lib/api/config";

export interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryId: number;
  budget: number | string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  urgency: "LOW" | "MEDIUM" | "HIGH";
  postedAt: string;
  postedBy: {
    id: number;
    name: string;
    avatar?: string;
    rating: number;
  };
  expectedDuration?: string;
  materialsNeeded?: string[];
  specializations?: string[];
  photos?: Array<{
    id: number;
    url: string;
    file_name: string;
  }>;
  applicationCount?: number;
  isSaved?: boolean;
}

export interface JobsResponse {
  success: boolean;
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobFilters {
  category?: number;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH";
  maxDistance?: number; // NEW: Distance filter in km
  sortBy?: string; // NEW: Sort option (distance_asc, distance_desc, budget_asc, budget_desc, created_desc, urgency_desc)
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch available jobs with optional filters
 */
export function useJobs(
  filters: JobFilters = {},
  options?: UseQueryOptions<JobsResponse, Error, JobsResponse>
) {
  return useQuery<JobsResponse, Error, JobsResponse>({
    queryKey: ["jobs", "available", filters],
    queryFn: async (): Promise<JobsResponse> => {
      const url = ENDPOINTS.JOB_LIST_FILTERED(filters);
      return fetchJson<JobsResponse>(url, { method: "GET" });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch jobs with infinite scroll pagination
 */
export function useInfiniteJobs(filters: Omit<JobFilters, "page"> = {}) {
  return useInfiniteQuery<JobsResponse, Error, InfiniteData<JobsResponse>>({
    queryKey: ["jobs", "available", "infinite", filters],
    queryFn: async ({ pageParam = 1 }): Promise<JobsResponse> => {
      const url = ENDPOINTS.JOB_LIST_FILTERED({
        ...filters,
        page: pageParam as number,
      });
      return fetchJson<JobsResponse>(url, { method: "GET" });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single job's details
 */
export function useJobDetail(
  jobId: number | string,
  options?: UseQueryOptions<Job>
) {
  return useQuery<Job>({
    queryKey: ["jobs", jobId],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_DETAILS(parseInt(jobId.toString()));
      const data = await fetchJson<any>(url, { method: "GET" });
      return data.job || data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    enabled: !!jobId,
    ...options,
  });
}

/**
 * Hook to check if user has applied to a job
 */
export function useHasApplied(jobId: number | string) {
  return useQuery<boolean>({
    queryKey: ["jobs", jobId, "applied"],
    queryFn: async () => {
      try {
        const data = await fetchJson<any>(ENDPOINTS.MY_APPLICATIONS, {
          method: "GET",
        });
        if (data?.success && data.applications) {
          return data.applications.some(
            (app: any) => app.job_id?.toString() === jobId.toString()
          );
        }
        return false;
      } catch (e) {
        return false;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!jobId,
  });
}
