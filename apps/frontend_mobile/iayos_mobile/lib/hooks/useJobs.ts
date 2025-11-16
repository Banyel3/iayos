/**
 * useJobs Hook - Fetch and manage job listings
 *
 * Features:
 * - Fetch available jobs with filters
 * - Pagination support
 * - Caching with TanStack Query
 * - Optimistic updates
 */

import { useQuery, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '@/lib/api/config';

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
  status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
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
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch available jobs with optional filters
 */
export function useJobs(filters: JobFilters = {}, options?: UseQueryOptions<JobsResponse>) {
  return useQuery<JobsResponse>({
    queryKey: ['jobs', 'available', filters],
    queryFn: async () => {
      const url = ENDPOINTS.JOB_LIST_FILTERED(filters);
      const response = await apiRequest(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch jobs with infinite scroll pagination
 */
export function useInfiniteJobs(filters: Omit<JobFilters, 'page'> = {}) {
  return useInfiniteQuery<JobsResponse>({
    queryKey: ['jobs', 'available', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const url = ENDPOINTS.JOB_LIST_FILTERED({ ...filters, page: pageParam as number });
      const response = await apiRequest(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      return data;
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
export function useJobDetail(jobId: number | string, options?: UseQueryOptions<Job>) {
  return useQuery<Job>({
    queryKey: ['jobs', jobId],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.JOB_DETAILS(parseInt(jobId.toString())), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
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
    queryKey: ['jobs', jobId, 'applied'],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.MY_APPLICATIONS, {
        method: 'GET',
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.applications) {
        return data.applications.some(
          (app: any) => app.job_id?.toString() === jobId.toString()
        );
      }
      return false;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!jobId,
  });
}
